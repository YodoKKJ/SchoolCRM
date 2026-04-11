package com.dom.schoolcrm.service;

import com.dom.schoolcrm.entity.FinBoleto;
import com.dom.schoolcrm.entity.FinContaReceber;
import com.dom.schoolcrm.entity.FinPessoa;
import com.dom.schoolcrm.repository.FinBoletoRepository;
import com.dom.schoolcrm.repository.FinContaReceberRepository;
import com.dom.schoolcrm.repository.FinFormaPagamentoRepository;
import com.dom.schoolcrm.repository.FinHistoricoPagamentoCRRepository;
import com.dom.schoolcrm.entity.FinHistoricoPagamentoCR;
import com.dom.schoolcrm.entity.FinFormaPagamento;
import com.dom.schoolcrm.service.boleto.BoletoRegistroException;
import com.dom.schoolcrm.service.boleto.BoletoService;
import com.dom.schoolcrm.util.FinUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Serviço de gestão de boletos do módulo financeiro.
 * Orquestra a criação, consulta, cancelamento e baixa de boletos,
 * delegando a comunicação com o banco para a implementação de BoletoService.
 */
@Service
@Transactional
public class FinBoletoService {

    @Autowired private FinBoletoRepository boletoRepository;
    @Autowired private FinContaReceberRepository crRepository;
    @Autowired private FinFormaPagamentoRepository formaPagamentoRepository;
    @Autowired private FinHistoricoPagamentoCRRepository historicoCRRepository;
    @Autowired private BoletoService boletoService;

    /**
     * Gera um boleto híbrido para uma conta a receber.
     */
    public ResponseEntity<?> gerarBoleto(Long contaReceberId) {
        FinContaReceber cr = crRepository.findById(contaReceberId).orElse(null);
        if (cr == null) return ResponseEntity.notFound().build();

        String statusCr = FinUtil.statusEfetivo(cr, LocalDate.now());
        if ("PAGO".equals(statusCr) || "CANCELADO".equals(statusCr)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "Conta a receber com status " + statusCr + " não pode gerar boleto."));
        }

        // Verifica se já existe boleto EMITIDO para esta CR
        var existente = boletoRepository.findByContaReceberIdAndStatus(contaReceberId, "EMITIDO");
        if (existente.isPresent()) {
            return ResponseEntity.ok(toMap(existente.get()));
        }

        // Determina o pagador (responsável do contrato ou pessoa da CR avulsa)
        FinPessoa pagador = null;
        if (cr.getContrato() != null && cr.getContrato().getResponsavelPrincipal() != null) {
            pagador = cr.getContrato().getResponsavelPrincipal();
        } else if (cr.getPessoa() != null) {
            pagador = cr.getPessoa();
        }

        if (pagador == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "Conta a receber sem pagador definido. Vincule um responsável ao contrato."));
        }

        String cpfCnpj = pagador.getCpf() != null ? pagador.getCpf() : pagador.getCnpj();
        if (cpfCnpj == null || cpfCnpj.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "Pagador sem CPF/CNPJ cadastrado. Atualize o cadastro da pessoa '" + pagador.getNome() + "'."));
        }

        // Monta o boleto
        FinBoleto boleto = new FinBoleto();
        boleto.setContaReceber(cr);
        boleto.setValor(cr.getValor());
        boleto.setDataVencimento(cr.getDataVencimento());
        boleto.setPagadorNome(pagador.getNome());
        boleto.setPagadorCpfCnpj(cpfCnpj);

        try {
            boleto = boletoService.registrar(boleto, cr);
            boletoRepository.save(boleto);
            return ResponseEntity.status(HttpStatus.CREATED).body(toMap(boleto));
        } catch (BoletoRegistroException e) {
            boleto.setStatus("REJEITADO");
            boleto.setErroMensagem(e.getMessage());
            boleto.setDataEmissao(LocalDate.now());
            boletoRepository.save(boleto);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("erro", "Falha ao registrar boleto no banco: " + e.getMessage()));
        }
    }

    /**
     * Gera boletos em lote para todas as parcelas pendentes de um contrato.
     */
    public ResponseEntity<?> gerarBoletosContrato(Long contratoId) {
        List<FinContaReceber> parcelas = crRepository.findByContratoIdOrderByNumParcelaAsc(contratoId);
        if (parcelas.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        LocalDate hoje = LocalDate.now();
        List<Map<String, Object>> resultados = parcelas.stream()
                .filter(cr -> {
                    String st = FinUtil.statusEfetivo(cr, hoje);
                    return "PENDENTE".equals(st) || "VENCIDO".equals(st);
                })
                .map(cr -> {
                    ResponseEntity<?> resp = gerarBoleto(cr.getId());
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("contaReceberId", cr.getId());
                    item.put("numParcela", cr.getNumParcela());
                    item.put("sucesso", resp.getStatusCode().is2xxSuccessful());
                    item.put("dados", resp.getBody());
                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "contratoId", contratoId,
                "boletosProcessados", resultados.size(),
                "resultados", resultados
        ));
    }

    /**
     * Consulta o status atualizado de um boleto.
     */
    public ResponseEntity<?> consultar(Long boletoId) {
        FinBoleto boleto = boletoRepository.findById(boletoId).orElse(null);
        if (boleto == null) return ResponseEntity.notFound().build();

        if ("EMITIDO".equals(boleto.getStatus())) {
            try {
                boleto = boletoService.consultar(boleto);
                boletoRepository.save(boleto);
            } catch (BoletoRegistroException e) {
                // Falha na consulta não altera o boleto, apenas retorna o estado atual
            }
        }

        return ResponseEntity.ok(toMap(boleto));
    }

    /**
     * Cancela um boleto emitido.
     */
    public ResponseEntity<?> cancelar(Long boletoId) {
        FinBoleto boleto = boletoRepository.findById(boletoId).orElse(null);
        if (boleto == null) return ResponseEntity.notFound().build();

        if (!"EMITIDO".equals(boleto.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "Só é possível cancelar boletos com status EMITIDO. Status atual: " + boleto.getStatus()));
        }

        try {
            boleto = boletoService.cancelar(boleto);
            boletoRepository.save(boleto);
            return ResponseEntity.ok(Map.of("mensagem", "Boleto cancelado com sucesso.", "boleto", toMap(boleto)));
        } catch (BoletoRegistroException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("erro", "Falha ao cancelar boleto no banco: " + e.getMessage()));
        }
    }

    /**
     * Processa notificação de pagamento (webhook).
     * Dá baixa no boleto e na conta a receber associada.
     */
    public void processarPagamento(String nossoNumero, BigDecimal valorPago, LocalDate dataPagamento) {
        FinBoleto boleto = boletoRepository.findByNossoNumero(nossoNumero).orElse(null);
        if (boleto == null || !"EMITIDO".equals(boleto.getStatus())) return;

        // Baixa no boleto
        boleto.setStatus("PAGO");
        boleto.setValorPago(valorPago);
        boleto.setDataPagamento(dataPagamento);
        boletoRepository.save(boleto);

        // Baixa na conta a receber
        FinContaReceber cr = boleto.getContaReceber();
        cr.setStatus("PAGO");
        cr.setValorPago(valorPago);
        cr.setDataPagamento(dataPagamento);

        // Vincula forma de pagamento BOLETO_SICOOB se existir
        FinFormaPagamento fpBoleto = formaPagamentoRepository.findByNome("BOLETO_SICOOB").orElse(null);
        if (fpBoleto != null) {
            cr.setFormaPagamento(fpBoleto);
        }
        crRepository.save(cr);

        // Registra no histórico de pagamento
        FinHistoricoPagamentoCR historico = new FinHistoricoPagamentoCR();
        historico.setContaReceber(cr);
        historico.setDataPagamento(dataPagamento);
        historico.setValorPago(valorPago);
        historico.setDataRegistro(LocalDateTime.now());
        historico.setObservacoes("Baixa automática via boleto Sicoob - Nosso Número: " + nossoNumero);
        if (fpBoleto != null) {
            historico.setFormaPagamento(fpBoleto);
        }
        historicoCRRepository.save(historico);
    }

    /**
     * Lista boletos com filtros opcionais.
     */
    public List<Map<String, Object>> listar(String status, Long alunoId, LocalDate de, LocalDate ate) {
        return boletoRepository.buscar(status, alunoId, de, ate).stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    /**
     * Retorna boletos vinculados a uma conta a receber.
     */
    public List<Map<String, Object>> listarPorContaReceber(Long contaReceberId) {
        return boletoRepository.findByContaReceberId(contaReceberId).stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    /**
     * Retorna info sobre o provedor de boleto ativo.
     */
    public Map<String, Object> getStatus() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("provedor", boletoService.getProvedor());
        m.put("ativo", boletoService.isAtivo());
        return m;
    }

    public Map<String, Object> toMap(FinBoleto b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", b.getId());
        m.put("contaReceberId", b.getContaReceber().getId());
        m.put("nossoNumero", b.getNossoNumero());
        m.put("seuNumero", b.getSeuNumero());
        m.put("linhaDigitavel", b.getLinhaDigitavel());
        m.put("codigoBarras", b.getCodigoBarras());
        m.put("pixCopiaCola", b.getPixCopiaCola());
        m.put("pixUrl", b.getPixUrl());
        m.put("valor", b.getValor());
        m.put("valorPago", b.getValorPago());
        m.put("dataEmissao", b.getDataEmissao());
        m.put("dataVencimento", b.getDataVencimento());
        m.put("dataPagamento", b.getDataPagamento());
        m.put("status", b.getStatus());
        m.put("pagadorNome", b.getPagadorNome());
        m.put("pagadorCpfCnpj", b.getPagadorCpfCnpj());
        m.put("erroMensagem", b.getErroMensagem());
        m.put("createdAt", b.getCreatedAt());

        // Contexto da parcela
        FinContaReceber cr = b.getContaReceber();
        m.put("parcelaDescricao", cr.getDescricao());
        if (cr.getNumParcela() != null) {
            m.put("numParcela", cr.getNumParcela());
            m.put("totalParcelas", cr.getTotalParcelas());
        }
        if (cr.getContrato() != null) {
            m.put("contratoId", cr.getContrato().getId());
            m.put("alunoNome", cr.getContrato().getAluno().getNome());
        } else if (cr.getPessoa() != null) {
            m.put("alunoNome", cr.getPessoa().getNome());
        }

        return m;
    }
}
