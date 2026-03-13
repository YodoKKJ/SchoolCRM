package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import com.dom.schoolcrm.util.FinUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gestão de Contas a Pagar.
 *
 * Listagem / CRUD:
 *   GET  /fin/contas-pagar                     → listar com filtros
 *   GET  /fin/contas-pagar/vencidas            → todas em atraso
 *   POST /fin/contas-pagar                     → lançamento avulso (fornecedor / outro)
 *   PUT  /fin/contas-pagar/{id}               → editar
 *   PATCH /fin/contas-pagar/{id}/baixar        → registrar pagamento
 *   PATCH /fin/contas-pagar/{id}/cancelar      → cancelar
 *
 * Geração em lote:
 *   POST /fin/contas-pagar/gerar-folha         → { mes: "2026-03" }
 *        Gera uma CP de salário para cada funcionário ativo no mês informado.
 *        Bloqueado se já existir folha para aquele funcionário/mês.
 *
 *   POST /fin/contas-pagar/gerar-recorrentes   → { mes: "2026-03" }
 *        Gera uma CP para cada modelo de conta fixa ativo.
 *        Bloqueado individualmente se o modelo já foi gerado naquele mês.
 */
@RestController
@RequestMapping("/fin/contas-pagar")
@PreAuthorize("hasRole('DIRECAO')")
public class FinContaPagarController {

    @Autowired private FinContaPagarRepository cpRepository;
    @Autowired private FinContaPagarModeloRepository modeloRepository;
    @Autowired private FinFuncionarioRepository funcionarioRepository;
    @Autowired private FinBeneficioRepository beneficioRepository;
    @Autowired private FinPessoaRepository pessoaRepository;
    @Autowired private FinFormaPagamentoRepository formaPagamentoRepository;
    @Autowired private FinConfiguracaoRepository configuracaoRepository;
    @Autowired private FinHistoricoPagamentoCPRepository historicoRepository;

    // ─── Listar com filtros ───────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String vencimentoDe,
            @RequestParam(required = false) String vencimentoAte,
            @RequestParam(required = false) String mesReferencia) {

        LocalDate de  = vencimentoDe  != null ? LocalDate.parse(vencimentoDe)  : null;
        LocalDate ate = vencimentoAte != null ? LocalDate.parse(vencimentoAte) : null;

        // B1: período inválido (de > ate) — falha silenciosa seria confusa para o usuário
        if (de != null && ate != null && de.isAfter(ate)) {
            return ResponseEntity.badRequest().body(List.of()); // body vazio mas tipado
        }

        String tipoF   = blank(tipo)    ? null : tipo.toUpperCase();
        String catF    = blank(categoria) ? null : categoria.toUpperCase();
        String mesF    = blank(mesReferencia) ? null : mesReferencia;

        // VENCIDO é computado — busca PENDENTE e filtra depois
        String statusDb = "VENCIDO".equalsIgnoreCase(status) ? "PENDENTE"
                        : (blank(status) ? null : status.toUpperCase());

        List<FinContaPagar> lista = cpRepository.buscar(tipoF, catF, statusDb, de, ate, mesF);
        LocalDate hoje = LocalDate.now();

        if ("VENCIDO".equalsIgnoreCase(status)) {
            lista = lista.stream()
                    .filter(cp -> cp.getDataVencimento().isBefore(hoje))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(lista.stream().map(cp -> toMap(cp, hoje)).collect(Collectors.toList()));
    }

    // ─── Vencidas ─────────────────────────────────────────────────────────────

    @GetMapping("/vencidas")
    public ResponseEntity<List<Map<String, Object>>> listarVencidas() {
        LocalDate hoje = LocalDate.now();
        return ResponseEntity.ok(
                cpRepository.findVencidas(hoje).stream()
                        .map(cp -> toMap(cp, hoje))
                        .collect(Collectors.toList())
        );
    }

    // ─── Lançamento avulso ────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {
        String descricao = str(body.get("descricao"));
        String tipo      = str(body.get("tipo"));
        String vencStr   = str(body.get("dataVencimento"));

        if (blank(descricao)) return ResponseEntity.badRequest().body("descricao é obrigatória.");
        if (blank(tipo))      return ResponseEntity.badRequest().body("tipo é obrigatório.");
        if (body.get("valor") == null) return ResponseEntity.badRequest().body("valor é obrigatório.");
        if (blank(vencStr))   return ResponseEntity.badRequest().body("dataVencimento é obrigatório.");

        FinContaPagar cp = new FinContaPagar();
        cp.setDescricao(descricao.trim());
        cp.setTipo(tipo.toUpperCase());
        String categoriaVal = str(body.get("categoria")); cp.setCategoria(body.containsKey("categoria") && !blank(categoriaVal) ? categoriaVal.toUpperCase() : "OUTRO");
        cp.setValor(new BigDecimal(body.get("valor").toString()));
        cp.setDataVencimento(LocalDate.parse(vencStr));
        cp.setStatus("PENDENTE");
        cp.setObservacoes(str(body.get("observacoes")));
        cp.setMesReferencia(str(body.get("mesReferencia")));

        Long pessoaId = parseLong(body.get("pessoaId"));
        if (pessoaId != null) pessoaRepository.findById(pessoaId).ifPresent(cp::setPessoa);

        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(cpRepository.save(cp), LocalDate.now()));
    }

    // ─── Editar ───────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        FinContaPagar cp = cpRepository.findById(id).orElse(null);
        if (cp == null) return ResponseEntity.notFound().build();
        if ("PAGO".equals(cp.getStatus()))
            return ResponseEntity.badRequest().body("Conta já paga não pode ser editada.");
        if ("PARCIALMENTE_PAGO".equals(cp.getStatus()))
            return ResponseEntity.badRequest().body("Conta com pagamento parcial não pode ser editada.");

        if (body.containsKey("descricao") && !blank(str(body.get("descricao"))))
            cp.setDescricao(str(body.get("descricao")).trim());
        if (body.containsKey("valor") && body.get("valor") != null)
            cp.setValor(new BigDecimal(body.get("valor").toString()));
        if (body.containsKey("dataVencimento") && !blank(str(body.get("dataVencimento"))))
            cp.setDataVencimento(LocalDate.parse(str(body.get("dataVencimento"))));
        if (body.containsKey("categoria") && !blank(str(body.get("categoria"))))
            cp.setCategoria(str(body.get("categoria")).toUpperCase());
        if (body.containsKey("observacoes"))
            cp.setObservacoes(str(body.get("observacoes")));

        return ResponseEntity.ok(toMap(cpRepository.save(cp), LocalDate.now()));
    }

    // ─── Baixar (registrar pagamento) ─────────────────────────────────────────

    @PatchMapping("/{id}/baixar")
    @Transactional
    public ResponseEntity<?> baixar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        FinContaPagar cp = cpRepository.findById(id).orElse(null);
        if (cp == null) return ResponseEntity.notFound().build();
        if ("PAGO".equals(cp.getStatus()))     return ResponseEntity.badRequest().body("Conta já paga.");
        if ("CANCELADO".equals(cp.getStatus())) return ResponseEntity.badRequest().body("Conta cancelada.");

        if (body.get("valorPago") == null) return ResponseEntity.badRequest().body("valorPago é obrigatório.");

        BigDecimal novoPagamento = new BigDecimal(body.get("valorPago").toString());
        if (novoPagamento.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Valor pago deve ser maior que zero.");
        }

        BigDecimal jaFoiPago = cp.getValorPago() != null ? cp.getValorPago() : BigDecimal.ZERO;
        BigDecimal totalPago  = jaFoiPago.add(novoPagamento);

        // Juros e multa para pagamentos em atraso
        BigDecimal juros = BigDecimal.ZERO;
        BigDecimal multa = BigDecimal.ZERO;

        LocalDate hoje = LocalDate.now();
        String dataPagStr = str(body.get("dataPagamento"));
        LocalDate dataPag = !blank(dataPagStr) ? LocalDate.parse(dataPagStr) : hoje;

        boolean estaVencida = cp.getDataVencimento().isBefore(dataPag);
        boolean isPrimeiroPagamento = cp.getJurosAplicado() == null && cp.getMultaAplicada() == null;

        if (estaVencida && isPrimeiroPagamento) {
            FinConfiguracao config = configuracaoRepository.findAll().stream().findFirst().orElse(null);
            if (config != null) {
                if (body.containsKey("jurosAplicado") && body.get("jurosAplicado") != null) {
                    juros = new BigDecimal(body.get("jurosAplicado").toString());
                } else if (config.getJurosAtrasoPct() != null) {
                    juros = cp.getValor()
                            .multiply(config.getJurosAtrasoPct())
                            .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                }
                if (body.containsKey("multaAplicada") && body.get("multaAplicada") != null) {
                    multa = new BigDecimal(body.get("multaAplicada").toString());
                } else if (config.getMultaAtrasoPct() != null) {
                    multa = cp.getValor()
                            .multiply(config.getMultaAtrasoPct())
                            .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                }
            }
            cp.setJurosAplicado(juros.compareTo(BigDecimal.ZERO) > 0 ? juros : null);
            cp.setMultaAplicada(multa.compareTo(BigDecimal.ZERO) > 0 ? multa : null);
        } else {
            // Pagamento subsequente: mantém juros/multa já aplicados
            juros = cp.getJurosAplicado() != null ? cp.getJurosAplicado() : BigDecimal.ZERO;
            multa = cp.getMultaAplicada() != null ? cp.getMultaAplicada() : BigDecimal.ZERO;
        }

        // Valida: não deixa pagar mais do que o saldo devedor
        BigDecimal saldoRestante = cp.getValor().add(juros).add(multa).subtract(jaFoiPago);
        if (novoPagamento.compareTo(saldoRestante) > 0) {
            return ResponseEntity.badRequest().body(String.format(
                    "Valor pago (%.2f) supera o saldo devedor (%.2f).", novoPagamento, saldoRestante));
        }

        cp.setValorPago(totalPago);
        cp.setDataPagamento(dataPag);

        // Status: PAGO se totalPago cobre o total devido; senão PARCIALMENTE_PAGO
        BigDecimal totalDevido = cp.getValor().add(juros).add(multa);
        cp.setStatus(totalPago.compareTo(totalDevido) >= 0 ? "PAGO" : "PARCIALMENTE_PAGO");

        Long fpId = parseLong(body.get("formaPagamentoId"));
        FinFormaPagamento fp = null;
        if (fpId != null) fp = formaPagamentoRepository.findById(fpId).orElse(null);
        if (fp != null) cp.setFormaPagamento(fp);

        if (body.containsKey("observacoes")) cp.setObservacoes(str(body.get("observacoes")));

        cpRepository.save(cp);

        // Registra histórico imutável desta baixa
        FinHistoricoPagamentoCP hist = new FinHistoricoPagamentoCP();
        hist.setContaPagar(cp);
        hist.setDataRegistro(java.time.LocalDateTime.now());
        hist.setDataPagamento(dataPag);
        hist.setValorPago(novoPagamento);
        hist.setFormaPagamento(fp);
        hist.setJurosAplicado(juros.compareTo(BigDecimal.ZERO) > 0 ? juros : null);
        hist.setMultaAplicada(multa.compareTo(BigDecimal.ZERO) > 0 ? multa : null);
        hist.setObservacoes(str(body.get("observacoes")));
        historicoRepository.save(hist);

        return ResponseEntity.ok(toMap(cp, hoje));
    }

    // ─── Histórico de pagamentos ───────────────────────────────────────────────

    @GetMapping("/{id}/historico")
    public ResponseEntity<?> historico(@PathVariable Long id) {
        if (!cpRepository.existsById(id)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(
            historicoRepository.findByContaPagarIdOrderByDataRegistroAsc(id).stream()
                .map(h -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", h.getId());
                    m.put("dataRegistro", h.getDataRegistro());
                    m.put("dataPagamento", h.getDataPagamento());
                    m.put("valorPago", h.getValorPago());
                    m.put("jurosAplicado", h.getJurosAplicado());
                    m.put("multaAplicada", h.getMultaAplicada());
                    m.put("formaPagamentoNome", h.getFormaPagamento() != null ? h.getFormaPagamento().getNome() : null);
                    m.put("observacoes", h.getObservacoes());
                    return m;
                })
                .collect(Collectors.toList())
        );
    }

    // ─── Cancelar ─────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        FinContaPagar cp = cpRepository.findById(id).orElse(null);
        if (cp == null) return ResponseEntity.notFound().build();
        if ("PAGO".equals(cp.getStatus())) return ResponseEntity.badRequest().body("Conta já paga não pode ser cancelada.");
        if ("PARCIALMENTE_PAGO".equals(cp.getStatus())) return ResponseEntity.badRequest().body("Conta parcialmente paga não pode ser cancelada.");
        cp.setStatus("CANCELADO");
        return ResponseEntity.ok(toMap(cpRepository.save(cp), LocalDate.now()));
    }

    // ─── Gerar Folha de Pagamento ─────────────────────────────────────────────

    @PostMapping("/gerar-folha")
    @Transactional
    public ResponseEntity<?> gerarFolha(@RequestBody Map<String, Object> body) {
        String mes = str(body.get("mes")); // formato "YYYY-MM"
        if (blank(mes)) return ResponseEntity.badRequest().body("mes é obrigatório (formato: YYYY-MM).");

        YearMonth ym;
        try { ym = YearMonth.parse(mes); }
        catch (Exception e) { return ResponseEntity.badRequest().body("Formato de mês inválido. Use YYYY-MM."); }

        List<FinFuncionario> funcionarios = funcionarioRepository.findByAtivoTrueOrderByPessoaNomeAsc();
        if (funcionarios.isEmpty()) return ResponseEntity.badRequest().body("Nenhum funcionário ativo cadastrado.");

        String nomeMes = ym.getMonth().getDisplayName(TextStyle.FULL, new Locale("pt", "BR"));
        nomeMes = nomeMes.substring(0, 1).toUpperCase() + nomeMes.substring(1);
        LocalDate inicioMes   = ym.atDay(1);
        LocalDate vencimento  = ym.atEndOfMonth(); // vencimento no último dia do mês

        List<Map<String, Object>> geradas = new ArrayList<>();
        List<String> ignoradas = new ArrayList<>();

        for (FinFuncionario func : funcionarios) {
            if (cpRepository.existsByFuncionarioIdAndMesReferencia(func.getId(), mes)) {
                ignoradas.add(func.getPessoa().getNome() + " (já gerado)");
                continue;
            }

            // B4: valida vínculo empregatício no mês da folha.
            // Admissão após o último dia do mês → ainda não estava empregado.
            if (func.getDataAdmissao() != null && func.getDataAdmissao().isAfter(vencimento)) {
                ignoradas.add(func.getPessoa().getNome() + " (admissão posterior ao mês)");
                continue;
            }
            // Demissão antes do primeiro dia do mês → já havia saído.
            if (func.getDataDemissao() != null && func.getDataDemissao().isBefore(inicioMes)) {
                ignoradas.add(func.getPessoa().getNome() + " (demitido antes do mês)");
                continue;
            }

            // Salário base + benefícios ativos
            List<FinBeneficio> beneficios = beneficioRepository.findByFuncionarioIdAndAtivoTrue(func.getId());
            BigDecimal totalBeneficios = beneficios.stream()
                    .map(FinBeneficio::getValor)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal salarioBase = func.getSalarioBase() != null ? func.getSalarioBase() : BigDecimal.ZERO;
            BigDecimal totalSalario = salarioBase.add(totalBeneficios);

            if (totalSalario.compareTo(BigDecimal.ZERO) <= 0) {
                ignoradas.add(func.getPessoa().getNome() + " (salário base não cadastrado)");
                continue;
            }

            FinContaPagar cp = new FinContaPagar();
            cp.setFuncionario(func);
            cp.setPessoa(func.getPessoa());
            cp.setDescricao("Salário " + func.getPessoa().getNome() + " - " + nomeMes + "/" + ym.getYear());
            cp.setTipo("SALARIO");
            cp.setCategoria("SALARIO");
            cp.setValor(totalSalario);
            cp.setDataVencimento(vencimento);
            cp.setStatus("PENDENTE");
            cp.setMesReferencia(mes);

            cpRepository.save(cp);
            geradas.add(Map.of(
                "funcionarioId", func.getId(),
                "nome", func.getPessoa().getNome(),
                "salarioBase", func.getSalarioBase(),
                "totalBeneficios", totalBeneficios,
                "totalSalario", totalSalario
            ));
        }

        return ResponseEntity.ok(Map.of(
            "mes", mes,
            "geradas", geradas.size(),
            "ignoradas", ignoradas.size(),
            "detalhes", geradas,
            "jaExistiam", ignoradas
        ));
    }

    // ─── Gerar Contas Fixas Recorrentes ──────────────────────────────────────

    @PostMapping("/gerar-recorrentes")
    @Transactional
    public ResponseEntity<?> gerarRecorrentes(@RequestBody Map<String, Object> body) {
        String mes = str(body.get("mes"));
        if (blank(mes)) return ResponseEntity.badRequest().body("mes é obrigatório (formato: YYYY-MM).");

        YearMonth ym;
        try { ym = YearMonth.parse(mes); }
        catch (Exception e) { return ResponseEntity.badRequest().body("Formato de mês inválido. Use YYYY-MM."); }

        List<FinContaPagarModelo> modelos = modeloRepository.findByAtivoTrueOrderByDescricaoAsc();
        if (modelos.isEmpty()) return ResponseEntity.badRequest().body("Nenhum modelo de conta fixa ativo cadastrado.");

        List<String> geradas   = new ArrayList<>();
        List<String> ignoradas = new ArrayList<>();

        for (FinContaPagarModelo modelo : modelos) {
            if (cpRepository.existsByModeloIdAndMesReferencia(modelo.getId(), mes)) {
                ignoradas.add(modelo.getDescricao() + " (já gerado)");
                continue;
            }

            // Dia de vencimento: garante que não ultrapasse o último dia do mês
            int dia = Math.min(modelo.getDiaVencimento(), ym.lengthOfMonth());
            LocalDate vencimento = LocalDate.of(ym.getYear(), ym.getMonth(), dia);

            FinContaPagar cp = new FinContaPagar();
            cp.setModelo(modelo);
            cp.setPessoa(modelo.getPessoa());
            cp.setDescricao(modelo.getDescricao() + " - "
                    + ym.getMonth().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"))
                    + "/" + ym.getYear());
            cp.setTipo("CONTA_FIXA");
            cp.setCategoria(modelo.getCategoria());
            cp.setValor(modelo.getValor());
            cp.setDataVencimento(vencimento);
            cp.setStatus("PENDENTE");
            cp.setMesReferencia(mes);

            cpRepository.save(cp);
            geradas.add(modelo.getDescricao());
        }

        return ResponseEntity.ok(Map.of(
            "mes", mes,
            "geradas", geradas.size(),
            "ignoradas", ignoradas.size(),
            "contas", geradas,
            "jaExistiam", ignoradas
        ));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> toMap(FinContaPagar cp, LocalDate hoje) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",             cp.getId());
        m.put("descricao",      cp.getDescricao());
        m.put("tipo",           cp.getTipo());
        m.put("categoria",      cp.getCategoria());
        m.put("valor",          cp.getValor());
        m.put("valorPago",      cp.getValorPago());
        m.put("dataVencimento", cp.getDataVencimento());
        m.put("dataPagamento",  cp.getDataPagamento());
        m.put("status",         FinUtil.statusEfetivo(cp, hoje));
        m.put("jurosAplicado",  cp.getJurosAplicado());
        m.put("multaAplicada",  cp.getMultaAplicada());
        m.put("mesReferencia",  cp.getMesReferencia());
        m.put("observacoes",    cp.getObservacoes());

        if (cp.getFormaPagamento() != null) {
            m.put("formaPagamentoId",   cp.getFormaPagamento().getId());
            m.put("formaPagamentoNome", cp.getFormaPagamento().getNome());
        } else {
            m.put("formaPagamentoId",   null);
            m.put("formaPagamentoNome", null);
        }

        if (cp.getFuncionario() != null) {
            m.put("funcionarioId",   cp.getFuncionario().getId());
            m.put("funcionarioNome", cp.getFuncionario().getPessoa().getNome());
        }
        if (cp.getPessoa() != null) {
            m.put("pessoaId",   cp.getPessoa().getId());
            m.put("pessoaNome", cp.getPessoa().getNome());
        }
        if (cp.getModelo() != null) {
            m.put("modeloId", cp.getModelo().getId());
        }

        // saldoDevedor = valor + juros + multa - totalPago
        BigDecimal totalDevidoMap = cp.getValor()
                .add(cp.getJurosAplicado() != null ? cp.getJurosAplicado() : BigDecimal.ZERO)
                .add(cp.getMultaAplicada() != null ? cp.getMultaAplicada() : BigDecimal.ZERO);
        BigDecimal pagoMap = cp.getValorPago() != null ? cp.getValorPago() : BigDecimal.ZERO;
        BigDecimal saldoMap = totalDevidoMap.subtract(pagoMap);
        m.put("saldoDevedor", saldoMap.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : saldoMap);

        return m;
    }

    private String str(Object v) { return v == null ? null : v.toString(); }
    private boolean blank(String s) { return s == null || s.isBlank(); }
    private Long parseLong(Object v) { return v == null ? null : ((Number) v).longValue(); }
}
