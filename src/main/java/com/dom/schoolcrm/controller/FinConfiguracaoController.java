package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinConfiguracao;
import com.dom.schoolcrm.repository.FinConfiguracaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Configurações globais do módulo financeiro.
 * Existe sempre um único registro (singleton) — GET retorna ou cria com defaults,
 * PUT atualiza os valores.
 */
@RestController
@RequestMapping("/fin/configuracoes")
@PreAuthorize("hasRole('DIRECAO')")
public class FinConfiguracaoController {

    @Autowired
    private FinConfiguracaoRepository repository;

    // Retorna a config atual; cria com valores padrão se ainda não existir
    @GetMapping
    public ResponseEntity<FinConfiguracao> obter() {
        FinConfiguracao config = repository.findAll()
                .stream().findFirst()
                .orElseGet(this::criarDefault);
        return ResponseEntity.ok(config);
    }

    @PutMapping
    public ResponseEntity<?> salvar(@RequestBody Map<String, Object> body) {
        FinConfiguracao config = repository.findAll()
                .stream().findFirst()
                .orElseGet(FinConfiguracao::new);

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

        return ResponseEntity.ok(repository.save(config));
    }

    private FinConfiguracao criarDefault() {
        FinConfiguracao config = new FinConfiguracao();
        config.setNumParcelasPadrao(12);
        config.setDiaVencimentoPadrao(10);
        config.setJurosAtrasoPct(new BigDecimal("1.00"));
        config.setMultaAtrasoPct(new BigDecimal("2.00"));
        return repository.save(config);
    }
}
