package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/vinculos")
public class VinculoController {

    @Autowired
    private AlunoTurmaRepository alunoTurmaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TurmaRepository turmaRepository;

    @PostMapping("/aluno-turma")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> vincularAluno(@RequestBody Map<String, String> body) {
        Long alunoId = Long.parseLong(body.get("alunoId"));
        Long turmaId = Long.parseLong(body.get("turmaId"));

        Optional<Usuario> aluno = usuarioRepository.findById(alunoId);
        Optional<Turma> turma = turmaRepository.findById(turmaId);

        if (aluno.isEmpty() || !aluno.get().getRole().equals("ALUNO")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Aluno não encontrado");
        }

        if (turma.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Turma não encontrada");
        }

        AlunoTurma vinculo = new AlunoTurma();
        vinculo.setAluno(aluno.get());
        vinculo.setTurma(turma.get());
        alunoTurmaRepository.save(vinculo);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensagem", "Aluno vinculado à turma com sucesso"));
    }

    @Autowired
    private MateriaRepository materiaRepository;

    @PostMapping("/professor-turma-materia")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> vincularProfessor(@RequestBody Map<String, String> body) {
        Long professorId = Long.parseLong(body.get("professorId"));
        Long turmaId = Long.parseLong(body.get("turmaId"));
        Long materiaId = Long.parseLong(body.get("materiaId"));

        Optional<Usuario> professor = usuarioRepository.findById(professorId);
        Optional<Turma> turma = turmaRepository.findById(turmaId);
        Optional<Materia> materia = materiaRepository.findById(materiaId);

        if (professor.isEmpty() || !professor.get().getRole().equals("PROFESSOR")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Professor não encontrado");
        }
        if (turma.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Turma não encontrada");
        }
        if (materia.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Matéria não encontrada");
        }

        ProfessorTurmaMateria vinculo = new ProfessorTurmaMateria();
        vinculo.setProfessor(professor.get());
        vinculo.setTurma(turma.get());
        vinculo.setMateria(materia.get());
        professorTurmaMateriaRepository.save(vinculo);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensagem", "Professor vinculado à turma/matéria com sucesso"));
    }
    @Autowired
    private ProfessorTurmaMateriaRepository professorTurmaMateriaRepository;
    @GetMapping("/aluno-turma")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> listarVinculosAluno() {
        return ResponseEntity.ok(alunoTurmaRepository.findAll());
    }

    @DeleteMapping("/aluno-turma")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> deletarVinculoAluno(@RequestBody Map<String, String> body) {
        Long alunoId = Long.parseLong(body.get("alunoId"));
        Long turmaId = Long.parseLong(body.get("turmaId"));

        Optional<Usuario> aluno = usuarioRepository.findById(alunoId);
        Optional<Turma> turma = turmaRepository.findById(turmaId);

        if (aluno.isEmpty() || turma.isEmpty()) {
            return ResponseEntity.badRequest().body("Aluno ou turma não encontrado");
        }

        alunoTurmaRepository.findAll().stream()
                .filter(v -> v.getAluno().getId().equals(alunoId) && v.getTurma().getId().equals(turmaId))
                .findFirst()
                .ifPresent(alunoTurmaRepository::delete);

        return ResponseEntity.ok(Map.of("mensagem", "Vínculo removido com sucesso"));
    }

    @GetMapping("/professor-turma-materia")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> listarVinculosProfessor() {
        return ResponseEntity.ok(professorTurmaMateriaRepository.findAll());
    }

    @DeleteMapping("/professor-turma-materia")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> deletarVinculoProfessor(@RequestBody Map<String, String> body) {
        Long professorId = Long.parseLong(body.get("professorId"));
        Long turmaId = Long.parseLong(body.get("turmaId"));
        Long materiaId = Long.parseLong(body.get("materiaId"));

        professorTurmaMateriaRepository.findAll().stream()
                .filter(v -> v.getProfessor().getId().equals(professorId)
                        && v.getTurma().getId().equals(turmaId)
                        && v.getMateria().getId().equals(materiaId))
                .findFirst()
                .ifPresent(professorTurmaMateriaRepository::delete);

        return ResponseEntity.ok(Map.of("mensagem", "Vínculo removido com sucesso"));
    }

    @GetMapping("/aluno-turma/turma/{turmaId}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> listarAlunosPorTurma(@PathVariable Long turmaId) {
        return ResponseEntity.ok(
                alunoTurmaRepository.findAll().stream()
                        .filter(v -> v.getTurma().getId().equals(turmaId))
                        .toList()
        );
    }

    @GetMapping("/professor-turma-materia/turma/{turmaId}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> listarProfessoresPorTurma(@PathVariable Long turmaId) {
        return ResponseEntity.ok(
                professorTurmaMateriaRepository.findAll().stream()
                        .filter(v -> v.getTurma().getId().equals(turmaId))
                        .toList()
        );
    }

}