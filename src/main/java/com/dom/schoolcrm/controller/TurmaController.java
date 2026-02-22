package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Serie;
import com.dom.schoolcrm.entity.Turma;
import com.dom.schoolcrm.repository.SerieRepository;
import com.dom.schoolcrm.repository.TurmaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/turmas")
public class TurmaController {

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private SerieRepository serieRepository;

    // Cadastrar série
    @PostMapping("/series")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> cadastrarSerie(@RequestBody Map<String, String> body) {
        Serie serie = new Serie();
        serie.setNome(body.get("nome"));
        serieRepository.save(serie);
        return ResponseEntity.status(HttpStatus.CREATED).body(serie);
    }

    // Listar séries
    @GetMapping("/series")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<List<Serie>> listarSeries() {
        return ResponseEntity.ok(serieRepository.findAll());
    }

    // Cadastrar turma
    @PostMapping
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> cadastrarTurma(@RequestBody Map<String, String> body) {
        Long serieId = Long.parseLong(body.get("serieId"));
        Optional<Serie> serie = serieRepository.findById(serieId);

        if (serie.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Série não encontrada");
        }

        Turma turma = new Turma();
        turma.setNome(body.get("nome"));
        turma.setSerie(serie.get());
        turma.setAnoLetivo(Integer.parseInt(body.get("anoLetivo")));
        turmaRepository.save(turma);

        return ResponseEntity.status(HttpStatus.CREATED).body(turma);
    }

    // Listar turmas
    @GetMapping
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<List<Turma>> listarTurmas() {
        return ResponseEntity.ok(turmaRepository.findAll());
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> deletarTurma(@PathVariable Long id) {
        if (!turmaRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Turma não encontrada");
        }
        turmaRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Turma removida com sucesso"));
    }

    @DeleteMapping("/series/{id}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> deletarSerie(@PathVariable Long id) {
        if (!serieRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Série não encontrada");
        }
        serieRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Série removida com sucesso"));
    }
}