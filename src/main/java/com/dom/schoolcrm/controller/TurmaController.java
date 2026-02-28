package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Serie;
import com.dom.schoolcrm.entity.Turma;
import com.dom.schoolcrm.repository.SerieRepository;
import com.dom.schoolcrm.repository.TurmaRepository;
import com.dom.schoolcrm.repository.AlunoTurmaRepository;
import com.dom.schoolcrm.repository.ProfessorTurmaMateriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.transaction.annotation.Transactional;
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

    @Autowired
    private AlunoTurmaRepository alunoTurmaRepository;

    @Autowired
    private ProfessorTurmaMateriaRepository professorTurmaMateriaRepository;

    @PostMapping("/series")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> cadastrarSerie(@RequestBody Map<String, String> body) {
        Serie serie = new Serie();
        serie.setNome(body.get("nome"));
        serieRepository.save(serie);
        return ResponseEntity.status(HttpStatus.CREATED).body(serie);
    }

    @GetMapping("/series")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<List<Serie>> listarSeries() {
        return ResponseEntity.ok(serieRepository.findAll());
    }

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

    @GetMapping
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<List<Turma>> listarTurmas() {
        return ResponseEntity.ok(turmaRepository.findAll());
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR')")
    public ResponseEntity<List<Turma>> buscar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Long serieId) {
        String nomeParam = (nome == null || nome.isBlank()) ? null : nome.trim();
        return ResponseEntity.ok(turmaRepository.buscar(nomeParam, serieId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> editarTurma(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var opt = turmaRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Turma não encontrada");

        Turma turma = opt.get();

        String nome = body.get("nome");
        if (nome != null && !nome.isBlank()) turma.setNome(nome.trim());

        String anoLetivo = body.get("anoLetivo");
        if (anoLetivo != null && !anoLetivo.isBlank()) turma.setAnoLetivo(Integer.parseInt(anoLetivo));

        String serieIdStr = body.get("serieId");
        if (serieIdStr != null && !serieIdStr.isBlank()) {
            var serie = serieRepository.findById(Long.parseLong(serieIdStr));
            if (serie.isEmpty()) return ResponseEntity.badRequest().body("Série não encontrada");
            turma.setSerie(serie.get());
        }

        turmaRepository.save(turma);

        return ResponseEntity.ok(Map.of(
                "id", turma.getId(),
                "nome", turma.getNome(),
                "anoLetivo", turma.getAnoLetivo(),
                "serie", turma.getSerie() != null ? turma.getSerie().getNome() : ""
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECAO')")
    @Transactional
    public ResponseEntity<?> deletarTurma(@PathVariable Long id) {
        if (!turmaRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Turma não encontrada");
        }
        alunoTurmaRepository.deleteByTurmaId(id);
        professorTurmaMateriaRepository.deleteByTurmaId(id);
        turmaRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Turma removida com sucesso"));
    }

    @DeleteMapping("/series/{id}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> deletarSerie(@PathVariable Long id) {
        if (!serieRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Série não encontrada");
        }
        if (!turmaRepository.findBySerieId(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Série possui turmas vinculadas e não pode ser excluída.");
        }
        serieRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Série removida com sucesso"));
    }
}