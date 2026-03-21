package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.service.FinBoletoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/fin/boletos")
@PreAuthorize("hasRole('DIRECAO')")
public class FinBoletoController {

    @Autowired private FinBoletoService boletoService;

    /** Gera boleto híbrido para uma conta a receber */
    @PostMapping("/gerar/{contaReceberId}")
    public ResponseEntity<?> gerar(@PathVariable Long contaReceberId) {
        return boletoService.gerarBoleto(contaReceberId);
    }

    /** Gera boletos em lote para todas as parcelas pendentes de um contrato */
    @PostMapping("/gerar-lote/{contratoId}")
    public ResponseEntity<?> gerarLote(@PathVariable Long contratoId) {
        return boletoService.gerarBoletosContrato(contratoId);
    }

    /** Consulta status atualizado de um boleto */
    @GetMapping("/{id}")
    public ResponseEntity<?> consultar(@PathVariable Long id) {
        return boletoService.consultar(id);
    }

    /** Cancela um boleto emitido */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        return boletoService.cancelar(id);
    }

    /** Lista boletos com filtros opcionais */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long alunoId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vencimentoDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vencimentoAte) {
        return ResponseEntity.ok(boletoService.listar(status, alunoId, vencimentoDe, vencimentoAte));
    }

    /** Boletos vinculados a uma conta a receber */
    @GetMapping("/por-conta-receber/{contaReceberId}")
    public ResponseEntity<List<Map<String, Object>>> listarPorCR(@PathVariable Long contaReceberId) {
        return ResponseEntity.ok(boletoService.listarPorContaReceber(contaReceberId));
    }

    /** Informações sobre o provedor de boleto ativo (MOCK ou SICOOB) */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(boletoService.getStatus());
    }
}
