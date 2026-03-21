package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.config.SicoobConfig;
import com.dom.schoolcrm.service.FinBoletoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * Endpoint público para receber notificações de pagamento do Sicoob.
 * Não requer autenticação JWT (liberado no SecurityConfig).
 * A validação é feita via webhook secret no header.
 */
@RestController
@RequestMapping("/webhooks/sicoob")
public class SicoobWebhookController {

    @Autowired private FinBoletoService boletoService;
    @Autowired private SicoobConfig sicoobConfig;

    /**
     * Recebe notificação de pagamento de boleto.
     * O Sicoob envia um POST com os dados do pagamento quando um boleto é liquidado.
     *
     * Payload esperado (será ajustado conforme documentação oficial):
     * {
     *   "nossoNumero": "100001",
     *   "valorPago": 150.00,
     *   "dataPagamento": "2026-03-20"
     * }
     */
    @PostMapping("/pagamento")
    public ResponseEntity<?> receberPagamento(
            @RequestHeader(value = "X-Webhook-Secret", required = false) String webhookSecret,
            @RequestBody Map<String, Object> payload) {

        // Validação do webhook secret (quando configurado)
        if (sicoobConfig.getWebhookSecret() != null && !sicoobConfig.getWebhookSecret().isBlank()) {
            if (!sicoobConfig.getWebhookSecret().equals(webhookSecret)) {
                return ResponseEntity.status(403).body(Map.of("erro", "Webhook secret inválido."));
            }
        }

        String nossoNumero = (String) payload.get("nossoNumero");
        if (nossoNumero == null || nossoNumero.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "nossoNumero é obrigatório."));
        }

        BigDecimal valorPago;
        try {
            valorPago = new BigDecimal(payload.get("valorPago").toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", "valorPago inválido."));
        }

        LocalDate dataPagamento;
        try {
            dataPagamento = LocalDate.parse(payload.get("dataPagamento").toString());
        } catch (Exception e) {
            dataPagamento = LocalDate.now();
        }

        boletoService.processarPagamento(nossoNumero, valorPago, dataPagamento);

        return ResponseEntity.ok(Map.of("mensagem", "Pagamento processado com sucesso."));
    }

    /** Health check para o Sicoob validar o endpoint */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
