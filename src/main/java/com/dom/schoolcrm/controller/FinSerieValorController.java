package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinSerieValor;
import com.dom.schoolcrm.entity.Serie;
import com.dom.schoolcrm.repository.FinSerieValorRepository;
import com.dom.schoolcrm.repository.SerieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Valor padrão de mensalidade por série e ano letivo.
 *
 * GET  /fin/serie-valores?anoLetivo=2026
 *   → Retorna todas as séries do sistema com seus valores para o ano informado.
 *     Séries sem valor cadastrado aparecem com valorPadrao: null.
 *
 * POST /fin/serie-valores   { serieId, anoLetivo, valorPadrao }
 *   → Upsert: cria ou atualiza o valor da série no ano letivo.
 */
@RestController
@RequestMapping("/fin/serie-valores")
@PreAuthorize("hasRole('DIRECAO')")
public class FinSerieValorController {

    @Autowired
    private FinSerieValorRepository serieValorRepository;

    @Autowired
    private SerieRepository serieRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(
            @RequestParam Integer anoLetivo) {

        List<Serie> todasSeries = serieRepository.findAll();
        List<FinSerieValor> valores = serieValorRepository.findByAnoLetivo(anoLetivo);

        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Serie serie : todasSeries) {
            Optional<FinSerieValor> valorOpt = valores.stream()
                    .filter(v -> v.getSerie().getId().equals(serie.getId()))
                    .findFirst();

            Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("serieId", serie.getId());
            item.put("serieNome", serie.getNome());
            item.put("anoLetivo", anoLetivo);

            if (valorOpt.isPresent()) {
                item.put("finSerieValorId", valorOpt.get().getId());
                item.put("valorPadrao", valorOpt.get().getValorPadrao());
                item.put("updatedAt", valorOpt.get().getUpdatedAt());
            } else {
                item.put("finSerieValorId", null);
                item.put("valorPadrao", null);
                item.put("updatedAt", null);
            }

            resultado.add(item);
        }

        return ResponseEntity.ok(resultado);
    }

    @PostMapping
    public ResponseEntity<?> salvar(@RequestBody Map<String, Object> body) {
        if (!body.containsKey("serieId") || !body.containsKey("anoLetivo") || !body.containsKey("valorPadrao")) {
            return ResponseEntity.badRequest().body("serieId, anoLetivo e valorPadrao são obrigatórios.");
        }

        Long serieId = ((Number) body.get("serieId")).longValue();
        Integer anoLetivo = ((Number) body.get("anoLetivo")).intValue();
        BigDecimal valorPadrao = new BigDecimal(body.get("valorPadrao").toString());

        if (valorPadrao.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("Valor deve ser maior que zero.");
        }

        Serie serie = serieRepository.findById(serieId).orElse(null);
        if (serie == null) return ResponseEntity.badRequest().body("Série não encontrada.");

        // Upsert: atualiza se já existe, cria se não existe
        FinSerieValor registro = serieValorRepository
                .findBySerieIdAndAnoLetivo(serieId, anoLetivo)
                .orElseGet(FinSerieValor::new);

        registro.setSerie(serie);
        registro.setAnoLetivo(anoLetivo);
        registro.setValorPadrao(valorPadrao);
        registro.setUpdatedAt(LocalDateTime.now());

        return ResponseEntity.ok(serieValorRepository.save(registro));
    }
}
