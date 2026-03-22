package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/vinculos")
public class VinculoController {

    @Autowired private AlunoTurmaRepository alunoTurmaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private TurmaRepository turmaRepository;
    @Autowired private MateriaRepository materiaRepository;
    @Autowired private ProfessorTurmaMateriaRepository professorTurmaMateriaRepository;
    @Autowired private NotaRepository notaRepository;
    @Autowired private PresencaRepository presencaRepository;

    // ─── Matrícula de aluno ───────────────────────────────────────────────────

    @PostMapping("/aluno-turma")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    @Transactional
    public ResponseEntity<?> vincularAluno(@RequestBody Map<String, String> body) {
        Long alunoId;
        Long turmaId;
        try {
            alunoId = Long.parseLong(body.get("alunoId"));
            turmaId = Long.parseLong(body.get("turmaId"));
        } catch (NumberFormatException | NullPointerException e) {
            return ResponseEntity.badRequest().body("alunoId e turmaId são obrigatórios e devem ser numéricos.");
        }

        Optional<Usuario> aluno = usuarioRepository.findById(alunoId);
        Optional<Turma> turma = turmaRepository.findById(turmaId);

        if (aluno.isEmpty() || !aluno.get().getRole().equals("ALUNO")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Aluno não encontrado");
        }
        if (turma.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Turma não encontrada");
        }

        Integer anoLetivo = turma.get().getAnoLetivo();
        boolean jaMatriculado = alunoTurmaRepository.findByAlunoId(alunoId).stream()
                .anyMatch(v -> v.getTurma().getAnoLetivo() != null
                        && v.getTurma().getAnoLetivo().equals(anoLetivo));
        if (jaMatriculado) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Aluno já está matriculado em uma turma em " + anoLetivo + ".");
        }

        try {
            AlunoTurma vinculo = new AlunoTurma();
            vinculo.setAluno(aluno.get());
            vinculo.setTurma(turma.get());
            alunoTurmaRepository.saveAndFlush(vinculo);
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Aluno já está matriculado nesta turma (conflito de dados).");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensagem", "Aluno vinculado à turma com sucesso"));
    }

    @GetMapping("/aluno-turma")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> listarVinculosAluno(
            @RequestParam(required = false) Long alunoId,
            @RequestParam(required = false) Integer anoLetivo) {

        List<AlunoTurma> lista = alunoId != null
                ? alunoTurmaRepository.findByAlunoId(alunoId)
                : alunoTurmaRepository.findAll();

        return ResponseEntity.ok(lista.stream()
                .filter(v -> anoLetivo == null || anoLetivo.equals(v.getTurma().getAnoLetivo()))
                .map(v -> Map.of(
                        "alunoId",   v.getAluno().getId(),
                        "alunoNome", v.getAluno().getNome(),
                        "turmaId",   v.getTurma().getId(),
                        "turmaNome", v.getTurma().getNome() != null ? v.getTurma().getNome() : "",
                        "anoLetivo", v.getTurma().getAnoLetivo(),
                        "serieId",   v.getTurma().getSerie().getId(),
                        "serieNome", v.getTurma().getSerie().getNome()
                ))
                .toList());
    }

    @GetMapping("/aluno-turma/turma/{turmaId}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR', 'COORDENACAO')")
    public ResponseEntity<?> listarAlunosPorTurma(@PathVariable Long turmaId) {
        return ResponseEntity.ok(alunoTurmaRepository.findByTurmaId(turmaId));
    }

    @GetMapping("/aluno-turma/ocupados-no-ano/{anoLetivo}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<List<Long>> alunosOcupadosNoAno(@PathVariable Integer anoLetivo) {
        return ResponseEntity.ok(alunoTurmaRepository.findAlunoIdsByAnoLetivo(anoLetivo));
    }

    @GetMapping("/aluno-turma/minhas")
    @PreAuthorize("hasAnyRole('ALUNO', 'DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> minhasTurmasAluno(org.springframework.security.core.Authentication auth) {
        String login = auth.getName();
        var aluno = usuarioRepository.findByLogin(login);
        if (aluno.isEmpty()) return ResponseEntity.badRequest().body("Aluno não encontrado");
        var vinculos = alunoTurmaRepository.findByAlunoId(aluno.get().getId());
        return ResponseEntity.ok(vinculos);
    }

    @GetMapping("/aluno-turma/historico/{alunoId}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> historicoAluno(@PathVariable Long alunoId) {
        var vinculos = alunoTurmaRepository.findByAlunoId(alunoId).stream()
                .sorted((a, b) -> {
                    Integer anoA = a.getTurma().getAnoLetivo();
                    Integer anoB = b.getTurma().getAnoLetivo();
                    if (anoA == null && anoB == null) return 0;
                    if (anoA == null) return 1;
                    if (anoB == null) return -1;
                    return anoB.compareTo(anoA);
                })
                .toList();
        return ResponseEntity.ok(vinculos);
    }

    @DeleteMapping("/aluno-turma")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    @Transactional
    public ResponseEntity<?> deletarVinculoAluno(@RequestBody Map<String, String> body) {
        Long alunoId;
        Long turmaId;
        try {
            alunoId = Long.parseLong(body.get("alunoId"));
            turmaId = Long.parseLong(body.get("turmaId"));
        } catch (NumberFormatException | NullPointerException e) {
            return ResponseEntity.badRequest().body("alunoId e turmaId são obrigatórios e devem ser numéricos.");
        }

        boolean temNotas = !notaRepository.findByAlunoIdAndAvaliacaoTurmaId(alunoId, turmaId).isEmpty();
        boolean temPresencas = !presencaRepository.findByAlunoIdAndTurmaId(alunoId, turmaId).isEmpty();

        if (temNotas || temPresencas) {
            String motivo = temNotas && temPresencas ? "notas e presenças"
                    : temNotas ? "notas" : "presenças";
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Não é possível remover o aluno desta turma pois ele já possui " + motivo + " registradas.");
        }

        alunoTurmaRepository.deleteByIdAlunoIdAndIdTurmaId(alunoId, turmaId);
        return ResponseEntity.ok(Map.of("mensagem", "Vínculo removido com sucesso"));
    }

    // ─── Vínculo professor-turma-matéria ────────────────────────────────────

    @PostMapping("/professor-turma-materia")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> vincularProfessor(@RequestBody Map<String, String> body) {
        Long professorId;
        Long turmaId;
        Long materiaId;
        try {
            professorId = Long.parseLong(body.get("professorId"));
            turmaId     = Long.parseLong(body.get("turmaId"));
            materiaId   = Long.parseLong(body.get("materiaId"));
        } catch (NumberFormatException | NullPointerException e) {
            return ResponseEntity.badRequest().body("professorId, turmaId e materiaId são obrigatórios e devem ser numéricos.");
        }

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

    @GetMapping("/professor-turma-materia")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> listarVinculosProfessor() {
        return ResponseEntity.ok(professorTurmaMateriaRepository.findAll());
    }

    @GetMapping("/professor-turma-materia/turma/{turmaId}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> listarProfessoresPorTurma(@PathVariable Long turmaId) {
        return ResponseEntity.ok(professorTurmaMateriaRepository.findByTurmaId(turmaId));
    }

    @GetMapping("/professor-turma-materia/minhas")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> minhasturmas(org.springframework.security.core.Authentication auth) {
        String login = auth.getName();
        var professor = usuarioRepository.findByLogin(login);
        if (professor.isEmpty()) return ResponseEntity.badRequest().body("Professor não encontrado");
        return ResponseEntity.ok(professorTurmaMateriaRepository.findByProfessorId(professor.get().getId()));
    }

    @DeleteMapping("/professor-turma-materia")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    @Transactional
    public ResponseEntity<?> deletarVinculoProfessor(@RequestBody Map<String, String> body) {
        Long professorId;
        Long turmaId;
        Long materiaId;
        try {
            professorId = Long.parseLong(body.get("professorId"));
            turmaId     = Long.parseLong(body.get("turmaId"));
            materiaId   = Long.parseLong(body.get("materiaId"));
        } catch (NumberFormatException | NullPointerException e) {
            return ResponseEntity.badRequest().body("professorId, turmaId e materiaId são obrigatórios e devem ser numéricos.");
        }

        professorTurmaMateriaRepository.deleteByIdProfessorIdAndIdTurmaIdAndIdMateriaId(professorId, turmaId, materiaId);
        return ResponseEntity.ok(Map.of("mensagem", "Vínculo removido com sucesso"));
    }
}
