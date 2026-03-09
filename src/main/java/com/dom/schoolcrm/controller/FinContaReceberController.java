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
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Operações sobre contas a receber individuais.
 *
 * GET   /fin/contas-receber                    → listar com filtros
 * GET   /fin/contas-receber/vencidas           → inadimplentes (para dashboard)
 * POST  /fin/contas-receber                    → CR avulsa (matrícula, uniforme, evento...)
 * PATCH /fin/contas-receber/{id}/baixar        → registrar pagamento
 * PATCH /fin/contas-receber/{id}/cancelar      → cancelar parcela
 * PUT   /fin/contas-receber/{id}               → editar dados da parcela (valor, vencimento...)
 */
@RestController
@RequestMapping("/fin/contas-receber")
@PreAuthorize("hasRole('DIRECAO')")
public class FinContaReceberController {

    @Autowired private FinContaReceberRepository crRepository;
    @Autowired private FinContratoRepository contratoRepository;
    @Autowired private FinPessoaRepository pessoaRepository;
    @Autowired private FinFormaPagamentoRepository formaPagamentoRepository;
    @Autowired private FinConfiguracaoRepository configuracaoRepository;
    @Autowired private FinHistoricoPagamentoCRRepository histCRRepo;


    // ─── Listar com filtros ───────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(
            @RequestParam(required = false) Long alunoId,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String vencimentoDe,
            @RequestParam(required = false) String vencimentoAte) {

        LocalDate de  = vencimentoDe  != null ? LocalDate.parse(vencimentoDe)  : null;
        LocalDate ate = vencimentoAte != null ? LocalDate.parse(vencimentoAte) : null;

        // B1: período inválido (de > ate) — falha silenciosa seria confusa para o usuário
        if (de != null && ate != null && de.isAfter(ate)) {
            return ResponseEntity.badRequest().body(null);
        }

        String tipoFiltro   = (tipo   != null && !tipo.isBlank())   ? tipo.toUpperCase()   : null;
        // VENCIDO é calculado em runtime — filtramos PENDENTE e depois aplicamos lógica
        String statusFiltro = (status != null && !status.isBlank()) ? status.toUpperCase() : null;
        String statusDb     = "VENCIDO".equals(statusFiltro) ? "PENDENTE" : statusFiltro;

        List<FinContaReceber> lista = crRepository.buscar(alunoId, tipoFiltro, statusDb, de, ate);
        LocalDate hoje = LocalDate.now();

        // Se filtro é VENCIDO, mantém só os realmente vencidos
        if ("VENCIDO".equals(statusFiltro)) {
            lista = lista.stream()
                    .filter(cr -> cr.getDataVencimento().isBefore(hoje))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(lista.stream().map(cr -> toMap(cr, hoje)).collect(Collectors.toList()));
    }

    // ─── Inadimplentes ────────────────────────────────────────────────────────

    @GetMapping("/vencidas")
    public ResponseEntity<List<Map<String, Object>>> listarVencidas() {
        LocalDate hoje = LocalDate.now();
        List<FinContaReceber> lista = crRepository.findVencidas(hoje);
        return ResponseEntity.ok(lista.stream().map(cr -> toMap(cr, hoje)).collect(Collectors.toList()));
    }

    // ─── CR avulsa ────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> criarAvulsa(@RequestBody Map<String, Object> body) {
        String descricao = (String) body.get("descricao");
        String tipo      = (String) body.get("tipo");
        Object valorRaw  = body.get("valor");
        String vencStr   = (String) body.get("dataVencimento");

        if (descricao == null || descricao.isBlank()) return ResponseEntity.badRequest().body("descricao é obrigatória.");
        if (tipo == null || tipo.isBlank())           return ResponseEntity.badRequest().body("tipo é obrigatório.");
        if (valorRaw == null)                         return ResponseEntity.badRequest().body("valor é obrigatório.");
        if (vencStr == null || vencStr.isBlank())     return ResponseEntity.badRequest().body("dataVencimento é obrigatória.");

        FinContaReceber cr = new FinContaReceber();
        cr.setDescricao(descricao.trim());
        cr.setTipo(tipo.toUpperCase());
        cr.setValor(new BigDecimal(valorRaw.toString()));
        cr.setDataVencimento(LocalDate.parse(vencStr));
        cr.setStatus("PENDENTE");
        cr.setObservacoes((String) body.get("observacoes"));

        // Pessoa pagadora (opcional em CR avulsa)
        Long pessoaId = parseLong(body.get("pessoaId"));
        if (pessoaId != null) {
            pessoaRepository.findById(pessoaId).ifPresent(cr::setPessoa);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(crRepository.save(cr), LocalDate.now()));
    }

    // ─── Baixar (registrar pagamento) ─────────────────────────────────────────

    @PatchMapping("/{id}/baixar")
    @Transactional
    public ResponseEntity<?> baixar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        FinContaReceber cr = crRepository.findById(id).orElse(null);
        if (cr == null) return ResponseEntity.notFound().build();

        if ("PAGO".equals(cr.getStatus())) {
            return ResponseEntity.badRequest().body("Esta parcela já foi paga.");
        }
        if ("CANCELADO".equals(cr.getStatus())) {
            return ResponseEntity.badRequest().body("Não é possível dar baixa em uma parcela cancelada.");
        }

        Object valorPagoRaw = body.get("valorPago");
        if (valorPagoRaw == null) return ResponseEntity.badRequest().body("valorPago é obrigatório.");

        BigDecimal novoPagamento = new BigDecimal(valorPagoRaw.toString());
        if (novoPagamento.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Valor pago deve ser maior que zero.");
        }

        // Acumula com pagamentos anteriores (suporte a baixa parcial)
        BigDecimal jaFoiPago = cr.getValorPago() != null ? cr.getValorPago() : BigDecimal.ZERO;
        BigDecimal totalPago = jaFoiPago.add(novoPagamento);

        // Juros e multa: aplica apenas no primeiro pagamento (se ainda não foram definidos)
        BigDecimal juros = cr.getJurosAplicado() != null ? cr.getJurosAplicado() : BigDecimal.ZERO;
        BigDecimal multa = cr.getMultaAplicada() != null ? cr.getMultaAplicada() : BigDecimal.ZERO;

        LocalDate hoje = LocalDate.now();
        boolean estaVencida = cr.getDataVencimento().isBefore(hoje);
        boolean primeirosPagamento = cr.getJurosAplicado() == null && cr.getMultaAplicada() == null;

        if (primeirosPagamento) {
            if (estaVencida) {
                FinConfiguracao config = configuracaoRepository.findAll().stream().findFirst().orElse(null);
                if (config != null) {
                    // Se a chave existe no body (mesmo que null), usa o valor enviado (null = zero explícito).
                    // Só auto-calcula quando a chave NÃO foi enviada pelo cliente.
                    if (body.containsKey("jurosAplicado")) {
                        juros = body.get("jurosAplicado") != null
                                ? new BigDecimal(body.get("jurosAplicado").toString())
                                : BigDecimal.ZERO;
                    } else if (config.getJurosAtrasoPct() != null
                            && config.getJurosAtrasoPct().compareTo(BigDecimal.ZERO) > 0) {
                        juros = cr.getValor()
                                .multiply(config.getJurosAtrasoPct())
                                .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                    }
                    if (body.containsKey("multaAplicada")) {
                        multa = body.get("multaAplicada") != null
                                ? new BigDecimal(body.get("multaAplicada").toString())
                                : BigDecimal.ZERO;
                    } else if (config.getMultaAtrasoPct() != null
                            && config.getMultaAtrasoPct().compareTo(BigDecimal.ZERO) > 0) {
                        multa = cr.getValor()
                                .multiply(config.getMultaAtrasoPct())
                                .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                    }
                }
            } else {
                if (body.containsKey("jurosAplicado") && body.get("jurosAplicado") != null)
                    juros = new BigDecimal(body.get("jurosAplicado").toString());
                if (body.containsKey("multaAplicada") && body.get("multaAplicada") != null)
                    multa = new BigDecimal(body.get("multaAplicada").toString());
            }
        }

        // Valida: não permite pagar mais do que o saldo devedor restante
        BigDecimal saldoRestante = cr.getValor().add(juros).add(multa).subtract(jaFoiPago);
        if (novoPagamento.compareTo(saldoRestante) > 0) {
            return ResponseEntity.badRequest().body(
                    String.format("Valor pago (R$ %.2f) supera o saldo devedor (R$ %.2f).",
                            novoPagamento, saldoRestante));
        }

        // Data de pagamento (preserva a existente em pagamentos subsequentes)
        String dataPagStr = (String) body.get("dataPagamento");
        if (dataPagStr != null && !dataPagStr.isBlank()) {
            cr.setDataPagamento(LocalDate.parse(dataPagStr));
        } else if (cr.getDataPagamento() == null) {
            cr.setDataPagamento(hoje);
        }

        // Forma de pagamento (opcional)
        Long fpId = parseLong(body.get("formaPagamentoId"));
        if (fpId != null) {
            formaPagamentoRepository.findById(fpId).ifPresent(cr::setFormaPagamento);
        }

        cr.setValorPago(totalPago);
        cr.setJurosAplicado(juros.compareTo(BigDecimal.ZERO) > 0 ? juros : null);
        cr.setMultaAplicada(multa.compareTo(BigDecimal.ZERO) > 0 ? multa : null);
        if (body.containsKey("observacoes")) cr.setObservacoes((String) body.get("observacoes"));

        // Status: PAGO se totalPago cobre o total devido; senão PARCIALMENTE_PAGO
        BigDecimal totalDevido = cr.getValor().add(juros).add(multa);
        cr.setStatus(totalPago.compareTo(totalDevido) >= 0 ? "PAGO" : "PARCIALMENTE_PAGO");

        FinContaReceber saved = crRepository.save(cr);

        // Registra histórico imutável da baixa (novoPagamento = valor pago nesta transação)
        FinHistoricoPagamentoCR hist = new FinHistoricoPagamentoCR();
        hist.setContaReceber(saved);
        hist.setDataRegistro(LocalDateTime.now());
        hist.setDataPagamento(saved.getDataPagamento());
        hist.setValorPago(novoPagamento);
        hist.setFormaPagamento(saved.getFormaPagamento());
        hist.setJurosAplicado(saved.getJurosAplicado());
        hist.setMultaAplicada(saved.getMultaAplicada());
        hist.setObservacoes(saved.getObservacoes());
        histCRRepo.save(hist);

        return ResponseEntity.ok(toMap(saved, hoje));
    }

    // ─── Cancelar parcela ─────────────────────────────────────────────────────

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        FinContaReceber cr = crRepository.findById(id).orElse(null);
        if (cr == null) return ResponseEntity.notFound().build();

        if ("PAGO".equals(cr.getStatus())) {
            return ResponseEntity.badRequest().body("Não é possível cancelar uma parcela já paga.");
        }
        // B2: parcela com pagamento parcial registrado não pode ser cancelada;
        // o valor já recebido precisaria de estorno — operação fora do escopo do sistema.
        if ("PARCIALMENTE_PAGO".equals(cr.getStatus())) {
            return ResponseEntity.badRequest().body(
                    "Não é possível cancelar uma parcela com pagamento parcial registrado. " +
                    "Realize o estorno manualmente antes de cancelar.");
        }

        cr.setStatus("CANCELADO");
        return ResponseEntity.ok(toMap(crRepository.save(cr), LocalDate.now()));
    }

    // ─── Excluir CR avulsa (apenas avulsas não pagas) ─────────────────────────

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> excluir(@PathVariable Long id) {
        FinContaReceber cr = crRepository.findById(id).orElse(null);
        if (cr == null) return ResponseEntity.notFound().build();

        // Mensagens de erro descritivas com base no estado atual
        if (cr.getContrato() != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Parcelas de contrato não podem ser excluídas. Use 'Cancelar' para desativá-las.");
        }
        if ("PAGO".equals(cr.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Recebimentos já pagos não podem ser excluídos.");
        }
        if ("PARCIALMENTE_PAGO".equals(cr.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Recebimentos com pagamento parcial não podem ser excluídos. Use 'Cancelar'.");
        }

        // Delete atômico: re-verifica as condições diretamente no banco para eliminar
        // race condition entre a leitura acima e a deleção efetiva.
        int deletados = crRepository.deleteAvulsaNaoPaga(id);
        if (deletados == 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Não foi possível excluir: o status da parcela foi alterado por outra operação.");
        }
        return ResponseEntity.noContent().build();
    }

    // ─── Editar parcela ───────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        FinContaReceber cr = crRepository.findById(id).orElse(null);
        if (cr == null) return ResponseEntity.notFound().build();

        if ("PAGO".equals(cr.getStatus())) {
            return ResponseEntity.badRequest().body("Parcela já paga não pode ser editada.");
        }

        if (body.containsKey("descricao") && body.get("descricao") != null)
            cr.setDescricao((String) body.get("descricao"));
        if (body.containsKey("valor") && body.get("valor") != null)
            cr.setValor(new BigDecimal(body.get("valor").toString()));
        if (body.containsKey("dataVencimento") && body.get("dataVencimento") != null)
            cr.setDataVencimento(LocalDate.parse((String) body.get("dataVencimento")));
        if (body.containsKey("observacoes"))
            cr.setObservacoes((String) body.get("observacoes"));

        return ResponseEntity.ok(toMap(crRepository.save(cr), LocalDate.now()));
    }

    // ─── Histórico de pagamentos ──────────────────────────────────────────────

    @GetMapping("/{id}/historico")
    public ResponseEntity<List<Map<String, Object>>> historico(@PathVariable Long id) {
        if (!crRepository.existsById(id)) return ResponseEntity.notFound().build();
        List<Map<String, Object>> result = histCRRepo
                .findByContaReceberIdOrderByDataRegistroAsc(id)
                .stream()
                .map(h -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",              h.getId());
                    m.put("dataRegistro",    h.getDataRegistro());
                    m.put("dataPagamento",   h.getDataPagamento());
                    m.put("valorPago",       h.getValorPago());
                    m.put("jurosAplicado",   h.getJurosAplicado());
                    m.put("multaAplicada",   h.getMultaAplicada());
                    m.put("observacoes",     h.getObservacoes());
                    m.put("formaPagamentoNome",
                            h.getFormaPagamento() != null ? h.getFormaPagamento().getNome() : null);
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ─── Helper de mapeamento ─────────────────────────────────────────────────

    private Map<String, Object> toMap(FinContaReceber cr, LocalDate hoje) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",             cr.getId());
        m.put("descricao",      cr.getDescricao());
        m.put("tipo",           cr.getTipo());
        m.put("numParcela",     cr.getNumParcela());
        m.put("totalParcelas",  cr.getTotalParcelas());
        m.put("valor",          cr.getValor());
        m.put("valorPago",      cr.getValorPago());
        // saldoDevedor = valor + juros + multa - totalPago
        BigDecimal totalDevido = cr.getValor()
                .add(cr.getJurosAplicado() != null ? cr.getJurosAplicado() : BigDecimal.ZERO)
                .add(cr.getMultaAplicada() != null ? cr.getMultaAplicada() : BigDecimal.ZERO);
        BigDecimal pago = cr.getValorPago() != null ? cr.getValorPago() : BigDecimal.ZERO;
        BigDecimal saldo = totalDevido.subtract(pago);
        m.put("saldoDevedor",   saldo.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : saldo);
        m.put("dataVencimento", cr.getDataVencimento());
        m.put("dataPagamento",  cr.getDataPagamento());
        m.put("status",         FinUtil.statusEfetivo(cr, hoje));
        m.put("jurosAplicado",  cr.getJurosAplicado());
        m.put("multaAplicada",  cr.getMultaAplicada());
        m.put("observacoes",    cr.getObservacoes());

        if (cr.getFormaPagamento() != null) {
            m.put("formaPagamentoId",   cr.getFormaPagamento().getId());
            m.put("formaPagamentoNome", cr.getFormaPagamento().getNome());
        } else {
            m.put("formaPagamentoId", null);
        }

        if (cr.getContrato() != null) {
            m.put("contratoId",  cr.getContrato().getId());
            m.put("alunoId",     cr.getContrato().getAluno().getId());
            m.put("alunoNome",   cr.getContrato().getAluno().getNome());
        }

        if (cr.getPessoa() != null) {
            m.put("pessoaId",    cr.getPessoa().getId());
            m.put("pessoaNome",  cr.getPessoa().getNome());
        }

        return m;
    }

    private Long parseLong(Object v) { return v == null ? null : ((Number) v).longValue(); }
}
