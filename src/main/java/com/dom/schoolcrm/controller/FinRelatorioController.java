package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.service.FinRelatorioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/relatorios/financeiro")
@PreAuthorize("hasRole('DIRECAO')")
public class FinRelatorioController {

    private static final Logger log = LoggerFactory.getLogger(FinRelatorioController.class);

    @Autowired
    private FinRelatorioService finRelatorioService;

    /**
     * Relatório de Contas a Receber por período.
     * Params: de, ate (yyyy-MM-dd obrigatórios), status? (PENDENTE|PAGO|CANCELADO|VENCIDO), tipo? (MENSALIDADE|...)
     */
    @GetMapping("/contas-receber")
    public ResponseEntity<byte[]> contasReceber(
            @RequestParam String de,
            @RequestParam String ate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tipo) {
        try {
            LocalDate dataIni = LocalDate.parse(de);
            LocalDate dataFim = LocalDate.parse(ate);
            // Status "VENCIDO" não existe no banco, buscar como PENDENTE no serviço resolve em runtime
            String statusDb = "VENCIDO".equals(status) ? null : status;
            byte[] pdf = finRelatorioService.gerarContasReceberPDF(dataIni, dataFim, statusDb, tipo);
            return pdfResponse(pdf, "relatorio_contas_receber.pdf");
        } catch (DateTimeParseException e) {
            return badRequest("Datas inválidas. Use o formato yyyy-MM-dd.");
        } catch (Exception e) {
            log.error("Erro ao gerar relatório CR: {}", e.getMessage(), e);
            return internalError(e);
        }
    }

    /**
     * Relatório de Contas a Pagar por período.
     * Params: de, ate (obrigatórios), status?, tipo?, categoria?
     */
    @GetMapping("/contas-pagar")
    public ResponseEntity<byte[]> contasPagar(
            @RequestParam String de,
            @RequestParam String ate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String categoria) {
        try {
            LocalDate dataIni = LocalDate.parse(de);
            LocalDate dataFim = LocalDate.parse(ate);
            String statusDb = "VENCIDO".equals(status) ? null : status;
            byte[] pdf = finRelatorioService.gerarContasPagarPDF(dataIni, dataFim, statusDb, tipo, categoria);
            return pdfResponse(pdf, "relatorio_contas_pagar.pdf");
        } catch (DateTimeParseException e) {
            return badRequest("Datas inválidas. Use o formato yyyy-MM-dd.");
        } catch (Exception e) {
            log.error("Erro ao gerar relatório CP: {}", e.getMessage(), e);
            return internalError(e);
        }
    }

    /**
     * Relatório de Inadimplência.
     * Param: dataBase? (yyyy-MM-dd, default = hoje)
     */
    @GetMapping("/inadimplencia")
    public ResponseEntity<byte[]> inadimplencia(
            @RequestParam(required = false) String dataBase) {
        try {
            LocalDate data = (dataBase != null && !dataBase.isBlank())
                    ? LocalDate.parse(dataBase) : LocalDate.now();
            byte[] pdf = finRelatorioService.gerarInadimplenciaPDF(data);
            return pdfResponse(pdf, "relatorio_inadimplencia.pdf");
        } catch (DateTimeParseException e) {
            return badRequest("Data inválida. Use o formato yyyy-MM-dd.");
        } catch (Exception e) {
            log.error("Erro ao gerar relatório inadimplência: {}", e.getMessage(), e);
            return internalError(e);
        }
    }

    /**
     * Relatório de Fluxo de Caixa.
     * Params: de, ate (obrigatórios)
     */
    @GetMapping("/fluxo-caixa")
    public ResponseEntity<byte[]> fluxoCaixa(
            @RequestParam String de,
            @RequestParam String ate) {
        try {
            LocalDate dataIni = LocalDate.parse(de);
            LocalDate dataFim = LocalDate.parse(ate);
            byte[] pdf = finRelatorioService.gerarFluxoCaixaPDF(dataIni, dataFim);
            return pdfResponse(pdf, "relatorio_fluxo_caixa.pdf");
        } catch (DateTimeParseException e) {
            return badRequest("Datas inválidas. Use o formato yyyy-MM-dd.");
        } catch (Exception e) {
            log.error("Erro ao gerar relatório fluxo de caixa: {}", e.getMessage(), e);
            return internalError(e);
        }
    }

    /**
     * Relatório de Folha de Pagamento.
     * Param: mes (yyyy-MM obrigatório)
     */
    @GetMapping("/folha-pagamento")
    public ResponseEntity<byte[]> folhaPagamento(
            @RequestParam String mes) {
        try {
            if (mes == null || !mes.matches("\\d{4}-\\d{2}"))
                return badRequest("Mês inválido. Use o formato yyyy-MM.");
            byte[] pdf = finRelatorioService.gerarFolhaPagamentoPDF(mes);
            return pdfResponse(pdf, "relatorio_folha_" + mes + ".pdf");
        } catch (Exception e) {
            log.error("Erro ao gerar relatório folha de pagamento: {}", e.getMessage(), e);
            return internalError(e);
        }
    }

    // ─── helpers ────────────────────────────────────────────────────────────

    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String filename) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(pdf);
    }

    private ResponseEntity<byte[]> badRequest(String msg) {
        return ResponseEntity.badRequest().body(msg.getBytes(StandardCharsets.UTF_8));
    }

    private ResponseEntity<byte[]> internalError(Exception e) {
        String detalhe = e.getClass().getSimpleName() + ": " + e.getMessage();
        return ResponseEntity.internalServerError()
                .contentType(MediaType.TEXT_PLAIN)
                .body(detalhe.getBytes(StandardCharsets.UTF_8));
    }
}
