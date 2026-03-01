package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gestão de contratos financeiros e geração automática de parcelas.
 *
 * GET  /fin/contratos?alunoId=&anoLetivo=      → listar contratos
 * GET  /fin/contratos/{id}                      → detalhe com parcelas
 * POST /fin/contratos                           → criar contrato + gerar parcelas
 * DELETE /fin/contratos/{id}                    → cancelar (apenas se sem parcelas pagas)
 *
 * Lógica de geração de parcelas:
 *  - valorParcela = valorTotal / numParcelas  (2 casas, arredonda HALF_UP)
 *  - A última parcela absorve o centavo de diferença (para bater exato o total)
 *  - diaVencimento e mesInicio vêm do body; se não informados, usa configuração global
 */
@RestController
@RequestMapping("/fin/contratos")
@PreAuthorize("hasRole('DIRECAO')")
public class FinContratoController {

    @Autowired private FinContratoRepository contratoRepository;
    @Autowired private FinContaReceberRepository crRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private FinPessoaRepository pessoaRepository;
    @Autowired private SerieRepository serieRepository;
    @Autowired private FinSerieValorRepository serieValorRepository;
    @Autowired private FinConfiguracaoRepository configuracaoRepository;
    @Autowired private FinFormaPagamentoRepository formaPagamentoRepository;

    // ─── Listar ───────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(
            @RequestParam(required = false) Long alunoId,
            @RequestParam(required = false) Integer anoLetivo) {

        List<FinContrato> lista;

        if (alunoId != null && anoLetivo != null) {
            lista = contratoRepository.findByAlunoIdAndAnoLetivo(alunoId, anoLetivo)
                    .map(List::of).orElse(List.of());
        } else if (alunoId != null) {
            lista = contratoRepository.findByAlunoIdOrderByAnoLetivoDesc(alunoId);
        } else if (anoLetivo != null) {
            lista = contratoRepository.findByAnoLetivoOrderByAlunoNomeAsc(anoLetivo);
        } else {
            lista = contratoRepository.findAll();
        }

        return ResponseEntity.ok(lista.stream().map(c -> toMap(c, false)).collect(Collectors.toList()));
    }

    // ─── Detalhe com parcelas ─────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return contratoRepository.findById(id)
                .map(c -> ResponseEntity.ok(toMap(c, true)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Criar contrato + gerar parcelas ─────────────────────────────────────

    @PostMapping
    @Transactional
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {

        // ── Validações de campos obrigatórios ──
        Long alunoId      = parseLong(body.get("alunoId"));
        Long respPrincId  = parseLong(body.get("responsavelPrincipalId"));
        Long serieId      = parseLong(body.get("serieId"));
        Integer anoLetivo = parseInteger(body.get("anoLetivo"));

        if (alunoId == null || respPrincId == null || serieId == null || anoLetivo == null) {
            return ResponseEntity.badRequest()
                    .body("alunoId, responsavelPrincipalId, serieId e anoLetivo são obrigatórios.");
        }

        // ── Busca entidades ──
        Usuario aluno = usuarioRepository.findById(alunoId).orElse(null);
        if (aluno == null || !"ALUNO".equals(aluno.getRole())) {
            return ResponseEntity.badRequest().body("Aluno não encontrado.");
        }

        if (contratoRepository.findByAlunoIdAndAnoLetivo(alunoId, anoLetivo).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Este aluno já possui um contrato para o ano letivo " + anoLetivo + ".");
        }

        FinPessoa respPrincipal = pessoaRepository.findById(respPrincId).orElse(null);
        if (respPrincipal == null) return ResponseEntity.badRequest().body("Responsável principal não encontrado.");

        Serie serie = serieRepository.findById(serieId).orElse(null);
        if (serie == null) return ResponseEntity.badRequest().body("Série não encontrada.");

        // ── Valor base: vem de FinSerieValor ou do body se informado manualmente ──
        BigDecimal valorBase;
        if (body.containsKey("valorBase") && body.get("valorBase") != null) {
            valorBase = new BigDecimal(body.get("valorBase").toString());
        } else {
            valorBase = serieValorRepository
                    .findBySerieIdAndAnoLetivo(serieId, anoLetivo)
                    .map(FinSerieValor::getValorPadrao)
                    .orElse(null);
            if (valorBase == null) {
                return ResponseEntity.badRequest()
                        .body("Nenhum valor de mensalidade cadastrado para esta série no ano " + anoLetivo
                              + ". Defina em Configurações > Valores por Série ou informe valorBase manualmente.");
            }
        }

        // ── Desconto e acréscimo ──
        BigDecimal desconto   = body.containsKey("desconto")   ? parseBigDecimal(body.get("desconto"))   : BigDecimal.ZERO;
        BigDecimal acrescimo  = body.containsKey("acrescimo")  ? parseBigDecimal(body.get("acrescimo"))  : BigDecimal.ZERO;
        BigDecimal valorTotal = valorBase.subtract(desconto).add(acrescimo);

        if (valorTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Valor total do contrato deve ser maior que zero.");
        }

        // ── Número de parcelas ──
        FinConfiguracao config = configuracaoRepository.findAll().stream().findFirst().orElse(null);
        Integer numParcelas = body.containsKey("numParcelas") && body.get("numParcelas") != null
                ? parseInteger(body.get("numParcelas"))
                : (config != null ? config.getNumParcelasPadrao() : 12);

        if (numParcelas == null || numParcelas < 1 || numParcelas > 60) {
            return ResponseEntity.badRequest().body("numParcelas deve ser entre 1 e 60.");
        }

        // ── Datas de vencimento ──
        int diaVencimento = body.containsKey("diaVencimento") && body.get("diaVencimento") != null
                ? parseInteger(body.get("diaVencimento"))
                : (config != null && config.getDiaVencimentoPadrao() != null ? config.getDiaVencimentoPadrao() : 10);

        // mesInicio: formato "YYYY-MM" ou "YYYY-M" — padrão: mês seguinte ao atual
        LocalDate inicioBase;
        if (body.containsKey("mesInicio") && body.get("mesInicio") != null) {
            YearMonth ymInicio = YearMonth.parse(body.get("mesInicio").toString());
            inicioBase = LocalDate.of(ymInicio.getYear(), ymInicio.getMonth(), diaVencimento);
        } else {
            LocalDate hoje = LocalDate.now();
            inicioBase = LocalDate.of(hoje.getYear(), hoje.getMonthValue(), diaVencimento)
                    .plusMonths(1);
        }

        // ── Persiste o contrato ──
        FinContrato contrato = new FinContrato();
        contrato.setAluno(aluno);
        contrato.setResponsavelPrincipal(respPrincipal);
        contrato.setSerie(serie);
        contrato.setAnoLetivo(anoLetivo);
        contrato.setValorBase(valorBase);
        contrato.setValorTotal(valorTotal);
        contrato.setNumParcelas(numParcelas);
        contrato.setDesconto(desconto.compareTo(BigDecimal.ZERO) == 0 ? null : desconto);
        contrato.setAcrescimo(acrescimo.compareTo(BigDecimal.ZERO) == 0 ? null : acrescimo);
        contrato.setObservacoes((String) body.get("observacoes"));

        // Responsável secundário (opcional)
        Long respSecId = parseLong(body.get("responsavelSecundarioId"));
        if (respSecId != null) {
            pessoaRepository.findById(respSecId).ifPresent(contrato::setResponsavelSecundario);
        }

        contratoRepository.save(contrato);

        // ── Gera parcelas ──
        List<FinContaReceber> parcelas = gerarParcelas(contrato, valorTotal, numParcelas, inicioBase, serie.getNome());
        crRepository.saveAll(parcelas);

        Map<String, Object> resposta = toMap(contrato, true);
        resposta.put("mensagem", numParcelas + " parcela(s) gerada(s) com sucesso.");

        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    // ─── Cancelar contrato ────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        FinContrato contrato = contratoRepository.findById(id).orElse(null);
        if (contrato == null) return ResponseEntity.notFound().build();

        if (crRepository.existsByContratoIdAndStatus(id, "PAGO")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Contrato possui parcelas já pagas e não pode ser excluído.");
        }

        // Cancela todas as parcelas pendentes antes de deletar
        List<FinContaReceber> parcelas = crRepository.findByContratoIdOrderByNumParcelaAsc(id);
        parcelas.forEach(p -> p.setStatus("CANCELADO"));
        crRepository.saveAll(parcelas);
        contratoRepository.deleteById(id);

        return ResponseEntity.ok(Map.of("mensagem", "Contrato e parcelas pendentes cancelados."));
    }

    // ─── Geração de parcelas ──────────────────────────────────────────────────

    private List<FinContaReceber> gerarParcelas(
            FinContrato contrato, BigDecimal valorTotal,
            int numParcelas, LocalDate inicioBase, String serieNome) {

        BigDecimal valorParcela = valorTotal.divide(
                BigDecimal.valueOf(numParcelas), 2, RoundingMode.HALF_UP);

        // Diferença de centavos acumulada vai para a última parcela
        BigDecimal totalGerado = valorParcela.multiply(BigDecimal.valueOf(numParcelas - 1));
        BigDecimal ultimaParcela = valorTotal.subtract(totalGerado);

        List<FinContaReceber> parcelas = new ArrayList<>();

        for (int i = 1; i <= numParcelas; i++) {
            FinContaReceber cr = new FinContaReceber();
            cr.setContrato(contrato);
            cr.setPessoa(contrato.getResponsavelPrincipal());
            cr.setDescricao("Mensalidade " + serieNome + " " + contrato.getAnoLetivo()
                            + " - Parcela " + i + "/" + numParcelas);
            cr.setTipo("MENSALIDADE");
            cr.setNumParcela(i);
            cr.setTotalParcelas(numParcelas);
            cr.setValor(i == numParcelas ? ultimaParcela : valorParcela);
            cr.setDataVencimento(inicioBase.plusMonths(i - 1));
            cr.setStatus("PENDENTE");
            parcelas.add(cr);
        }

        return parcelas;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> toMap(FinContrato c, boolean comParcelas) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",         c.getId());
        m.put("anoLetivo",  c.getAnoLetivo());
        m.put("valorBase",  c.getValorBase());
        m.put("desconto",   c.getDesconto());
        m.put("acrescimo",  c.getAcrescimo());
        m.put("valorTotal", c.getValorTotal());
        m.put("numParcelas", c.getNumParcelas());
        m.put("observacoes", c.getObservacoes());
        m.put("createdAt",  c.getCreatedAt());

        m.put("alunoId",    c.getAluno().getId());
        m.put("alunoNome",  c.getAluno().getNome());
        m.put("serieId",    c.getSerie().getId());
        m.put("serieNome",  c.getSerie().getNome());

        m.put("responsavelPrincipalId",   c.getResponsavelPrincipal().getId());
        m.put("responsavelPrincipalNome", c.getResponsavelPrincipal().getNome());

        if (c.getResponsavelSecundario() != null) {
            m.put("responsavelSecundarioId",   c.getResponsavelSecundario().getId());
            m.put("responsavelSecundarioNome", c.getResponsavelSecundario().getNome());
        } else {
            m.put("responsavelSecundarioId", null);
        }

        if (comParcelas) {
            List<FinContaReceber> parcelas = crRepository.findByContratoIdOrderByNumParcelaAsc(c.getId());
            LocalDate hoje = LocalDate.now();

            List<Map<String, Object>> parcelasMap = parcelas.stream().map(p -> {
                Map<String, Object> pm = new LinkedHashMap<>();
                pm.put("id",              p.getId());
                pm.put("numParcela",      p.getNumParcela());
                pm.put("totalParcelas",   p.getTotalParcelas());
                pm.put("valor",           p.getValor());
                pm.put("valorPago",       p.getValorPago());
                pm.put("dataVencimento",  p.getDataVencimento());
                pm.put("dataPagamento",   p.getDataPagamento());
                pm.put("status",          statusEfetivo(p, hoje));
                pm.put("jurosAplicado",   p.getJurosAplicado());
                pm.put("multaAplicada",   p.getMultaAplicada());
                pm.put("observacoes",     p.getObservacoes());
                if (p.getFormaPagamento() != null) {
                    pm.put("formaPagamentoId",   p.getFormaPagamento().getId());
                    pm.put("formaPagamentoNome", p.getFormaPagamento().getNome());
                }
                return pm;
            }).collect(Collectors.toList());

            m.put("parcelas", parcelasMap);

            long pagas    = parcelas.stream().filter(p -> "PAGO".equals(p.getStatus())).count();
            long vencidas = parcelas.stream().filter(p -> "PENDENTE".equals(p.getStatus())
                            && p.getDataVencimento().isBefore(hoje)).count();
            long pendentes = parcelas.stream().filter(p -> "PENDENTE".equals(p.getStatus())
                            && !p.getDataVencimento().isBefore(hoje)).count();

            m.put("resumo", Map.of(
                "pagas", pagas,
                "vencidas", vencidas,
                "pendentes", pendentes,
                "totalParcelas", parcelas.size()
            ));
        }

        return m;
    }

    private String statusEfetivo(FinContaReceber cr, LocalDate hoje) {
        if ("PENDENTE".equals(cr.getStatus()) && cr.getDataVencimento().isBefore(hoje)) return "VENCIDO";
        return cr.getStatus();
    }

    private Long parseLong(Object v) { return v == null ? null : ((Number) v).longValue(); }
    private Integer parseInteger(Object v) { return v == null ? null : ((Number) v).intValue(); }
    private BigDecimal parseBigDecimal(Object v) {
        if (v == null) return BigDecimal.ZERO;
        BigDecimal result = new BigDecimal(v.toString());
        return result.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : result;
    }
}
