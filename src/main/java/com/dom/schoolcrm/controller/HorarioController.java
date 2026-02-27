package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/horarios")
public class HorarioController {

    @Autowired private HorarioRepository horarioRepository;
    @Autowired private TurmaRepository turmaRepository;
    @Autowired private MateriaRepository materiaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProfessorTurmaMateriaRepository professorTurmaMateriaRepository;
    @Autowired private AlunoTurmaRepository alunoTurmaRepository;

    private static final List<String> DIAS_VALIDOS = List.of("SEG", "TER", "QUA", "QUI", "SEX");

    // Criar ou atualizar um horário individual
    @PostMapping
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> salvar(@RequestBody Map<String, String> body) {
        Long turmaId = Long.parseLong(body.get("turmaId"));
        Long materiaId = Long.parseLong(body.get("materiaId"));
        Long professorId = Long.parseLong(body.get("professorId"));
        String diaSemana = body.get("diaSemana");
        Integer ordemAula = Integer.parseInt(body.get("ordemAula"));
        String horarioInicio = body.get("horarioInicio");

        if (!DIAS_VALIDOS.contains(diaSemana))
            return ResponseEntity.badRequest().body("Dia inválido. Use: SEG, TER, QUA, QUI, SEX");

        var turma = turmaRepository.findById(turmaId);
        var materia = materiaRepository.findById(materiaId);
        var professor = usuarioRepository.findById(professorId);

        if (turma.isEmpty()) return ResponseEntity.badRequest().body("Turma não encontrada");
        if (materia.isEmpty()) return ResponseEntity.badRequest().body("Matéria não encontrada");
        if (professor.isEmpty() || !"PROFESSOR".equals(professor.get().getRole()))
            return ResponseEntity.badRequest().body("Professor não encontrado");

        // Se já existe horário nesse slot, atualiza
        Optional<Horario> existente = horarioRepository
                .findByTurmaIdAndDiaSemanaAndOrdemAula(turmaId, diaSemana, ordemAula);

        Horario horario = existente.orElse(new Horario());
        horario.setTurma(turma.get());
        horario.setMateria(materia.get());
        horario.setProfessor(professor.get());
        horario.setDiaSemana(diaSemana);
        horario.setOrdemAula(ordemAula);
        horario.setHorarioInicio(horarioInicio);
        horarioRepository.save(horario);

        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(horario));
    }

    // Salvar horários em lote (toda a grade de uma turma de uma vez)
    @PostMapping("/lote")
    @PreAuthorize("hasRole('DIRECAO')")
    @Transactional
    public ResponseEntity<?> salvarLote(@RequestBody Map<String, Object> body) {
        Long turmaId = Long.parseLong(body.get("turmaId").toString());
        var turma = turmaRepository.findById(turmaId);
        if (turma.isEmpty()) return ResponseEntity.badRequest().body("Turma não encontrada");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> aulas = (List<Map<String, Object>>) body.get("aulas");
        if (aulas == null || aulas.isEmpty())
            return ResponseEntity.badRequest().body("Lista de aulas vazia");

        // Remove horários antigos da turma
        horarioRepository.deleteByTurmaId(turmaId);

        List<Map<String, Object>> salvos = new ArrayList<>();
        for (Map<String, Object> aula : aulas) {
            String diaSemana = (String) aula.get("diaSemana");
            Integer ordemAula = Integer.parseInt(aula.get("ordemAula").toString());
            String horarioInicio = (String) aula.get("horarioInicio");
            Long materiaId = Long.parseLong(aula.get("materiaId").toString());
            Long professorId = Long.parseLong(aula.get("professorId").toString());

            var materia = materiaRepository.findById(materiaId);
            var professor = usuarioRepository.findById(professorId);
            if (materia.isEmpty() || professor.isEmpty()) continue;

            Horario h = new Horario();
            h.setTurma(turma.get());
            h.setMateria(materia.get());
            h.setProfessor(professor.get());
            h.setDiaSemana(diaSemana);
            h.setOrdemAula(ordemAula);
            h.setHorarioInicio(horarioInicio);
            horarioRepository.save(h);
            salvos.add(toMap(h));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensagem", "Horários salvos com sucesso",
                "total", salvos.size(),
                "horarios", salvos
        ));
    }

    // Listar horários filtrados pelo perfil do usuário logado
    // ALUNO → apenas sua turma | PROFESSOR → apenas suas turmas | DIRECAO → todos
    @GetMapping("/minhas")
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR', 'ALUNO')")
    public ResponseEntity<?> listarMinhas(Authentication auth) {
        String login = auth.getName();
        var usuario = usuarioRepository.findByLogin(login);
        if (usuario.isEmpty()) return ResponseEntity.badRequest().body("Usuário não encontrado");

        String role = usuario.get().getRole();

        if ("ALUNO".equals(role)) {
            var vinculos = alunoTurmaRepository.findByAlunoId(usuario.get().getId());
            List<Long> turmaIds = vinculos.stream()
                    .map(v -> v.getTurma().getId())
                    .distinct()
                    .collect(Collectors.toList());
            if (turmaIds.isEmpty()) return ResponseEntity.ok(List.of());
            List<Horario> horarios = horarioRepository
                    .findByTurmaIdInOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc(turmaIds);
            return ResponseEntity.ok(horarios.stream().map(this::toMap).toList());
        }

        if ("PROFESSOR".equals(role)) {
            var vinculos = professorTurmaMateriaRepository.findByProfessorId(usuario.get().getId());
            List<Long> turmaIds = vinculos.stream()
                    .map(v -> v.getTurma().getId())
                    .distinct()
                    .collect(Collectors.toList());
            if (turmaIds.isEmpty()) return ResponseEntity.ok(List.of());
            List<Horario> horarios = horarioRepository
                    .findByTurmaIdInOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc(turmaIds);
            return ResponseEntity.ok(horarios.stream().map(this::toMap).toList());
        }

        // DIRECAO: todos
        List<Horario> todos = horarioRepository.findAllByOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc();
        return ResponseEntity.ok(todos.stream().map(this::toMap).toList());
    }

    // Listar TODOS os horários (todos os perfis logados podem ver)
    @GetMapping
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR', 'ALUNO')")
    public ResponseEntity<?> listarTodos() {
        List<Horario> todos = horarioRepository.findAllByOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc();
        return ResponseEntity.ok(todos.stream().map(this::toMap).toList());
    }

    // Listar horários de uma turma específica
    @GetMapping("/turma/{turmaId}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR', 'ALUNO')")
    public ResponseEntity<?> listarPorTurma(@PathVariable Long turmaId) {
        List<Horario> horarios = horarioRepository.findByTurmaIdOrderByOrdemAula(turmaId);
        return ResponseEntity.ok(horarios.stream().map(this::toMap).toList());
    }

    // Deletar um horário individual
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        if (!horarioRepository.existsById(id))
            return ResponseEntity.notFound().build();
        horarioRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Horário removido"));
    }

    // Deletar todos os horários de uma turma
    @DeleteMapping("/turma/{turmaId}")
    @PreAuthorize("hasRole('DIRECAO')")
    @Transactional
    public ResponseEntity<?> deletarPorTurma(@PathVariable Long turmaId) {
        horarioRepository.deleteByTurmaId(turmaId);
        return ResponseEntity.ok(Map.of("mensagem", "Horários da turma removidos"));
    }

    private Map<String, Object> toMap(Horario h) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", h.getId());
        m.put("turmaId", h.getTurma().getId());
        m.put("turmaNome", h.getTurma().getNome());
        m.put("materiaId", h.getMateria().getId());
        m.put("materiaNome", h.getMateria().getNome());
        m.put("professorId", h.getProfessor().getId());
        m.put("professorNome", h.getProfessor().getNome());
        m.put("diaSemana", h.getDiaSemana());
        m.put("horarioInicio", h.getHorarioInicio());
        m.put("ordemAula", h.getOrdemAula());
        return m;
    }
}
