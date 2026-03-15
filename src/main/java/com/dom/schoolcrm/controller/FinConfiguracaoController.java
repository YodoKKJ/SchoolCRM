package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinConfiguracao;
import com.dom.schoolcrm.service.FinConfiguracaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Configurações globais do módulo financeiro.
 * Existe sempre um único registro (singleton) — GET retorna ou cria com defaults,
 * PUT atualiza os valores e evict o cache automaticamente via FinConfiguracaoService.
 */
@RestController
@RequestMapping("/fin/configuracoes")
public class FinConfiguracaoController {

    @Autowired
    private FinConfiguracaoService configuracaoService;

    // Retorna a config atual (cached) — restrito a DIRECAO/COORDENACAO (dados financeiros sensíveis)
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    @GetMapping
    public ResponseEntity<FinConfiguracao> obter() {
        return ResponseEntity.ok(configuracaoService.getConfig());
    }

    @PreAuthorize("hasRole('DIRECAO')")
    @PutMapping
    public ResponseEntity<?> salvar(@RequestBody Map<String, Object> body) {
        FinConfiguracao config = configuracaoService.getConfig();

        if (body.containsKey("numParcelasPadrao")) {
            config.setNumParcelasPadrao(((Number) body.get("numParcelasPadrao")).intValue());
        }
        if (body.containsKey("diaVencimentoPadrao")) {
            int dia = ((Number) body.get("diaVencimentoPadrao")).intValue();
            if (dia < 1 || dia > 28) {
                return ResponseEntity.badRequest().body("Dia de vencimento deve ser entre 1 e 28.");
            }
            config.setDiaVencimentoPadrao(dia);
        }
        if (body.containsKey("jurosAtrasoPct")) {
            config.setJurosAtrasoPct(new BigDecimal(body.get("jurosAtrasoPct").toString()));
        }
        if (body.containsKey("multaAtrasoPct")) {
            config.setMultaAtrasoPct(new BigDecimal(body.get("multaAtrasoPct").toString()));
        }
        if (body.containsKey("mediaMinima")) {
            BigDecimal mm = new BigDecimal(body.get("mediaMinima").toString());
            if (mm.compareTo(BigDecimal.ZERO) < 0 || mm.compareTo(BigDecimal.TEN) > 0) {
                return ResponseEntity.badRequest().body("Média mínima deve estar entre 0 e 10.");
            }
            config.setMediaMinima(mm);
        }
        if (body.containsKey("freqMinima")) {
            BigDecimal fm = new BigDecimal(body.get("freqMinima").toString());
            if (fm.compareTo(BigDecimal.ZERO) < 0 || fm.compareTo(new BigDecimal("100")) > 0) {
                return ResponseEntity.badRequest().body("Frequência mínima deve estar entre 0 e 100.");
            }
            config.setFreqMinima(fm);
        }

        // save() via serviço evict o cache automaticamente
        return ResponseEntity.ok(configuracaoService.save(config));
    }
}
