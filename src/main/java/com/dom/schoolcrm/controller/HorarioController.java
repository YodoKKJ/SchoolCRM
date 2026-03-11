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

import java.time.LocalDate;
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

    // Criar ou atualizar um horário individual (com versionamento automático)
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

        LocalDate hoje = LocalDate.now();

        // Busca o slot ativo atual (sem data_fim_vigencia)
        Optional<Horario> existente = horarioRepository
                .findByTurmaIdAndDiaSemanaAndOrdemAulaAndDataFimVigenciaIsNull(turmaId, diaSemana, ordemAula);

        Horario horario;
        if (existente.isPresent()) {
            Horario atual = existente.get();
            // Edição no mesmo dia de criação (ou registro legado sem data): atualiza in-place
            if (atual.getDataInicioVigencia() == null || hoje.equals(atual.getDataInicioVigencia())) {
                horario = atual;
            } else {
                // Fecha a versão antiga e cria nova versão a partir de hoje
                atual.setDataFimVigencia(hoje.minusDays(1));
                horarioRepository.save(atual);
                horario = new Horario();
                horario.setDataInicioVigencia(hoje);
            }
        } else {
            horario = new Horario();
            horario.setDataInicioVigencia(hoje);
        }

        horario.setTurma(turma.get());
        horario.setMateria(materia.get());
        horario.setProfessor(professor.get());
        horario.setDiaSemana(diaSemana);
        horario.setOrdemAula(ordemAula);
        horario.setHorarioInicio(horarioInicio);
        horarioRepository.save(horario);

        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(horario));
    }

    // Salvar horários em lote (toda a grade de uma turma de uma vez) com versionamento
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

        LocalDate hoje = LocalDate.now();

        // Versiona ou remove os registros ativos da turma
        List<Horario> ativos = horarioRepository.findByTurmaIdAndDataFimVigenciaIsNull(turmaId);
        for (Horario ativo : ativos) {
            if (ativo.getDataInicioVigencia() == null || hoje.equals(ativo.getDataInicioVigencia())) {
                // Registro legado ou criado hoje: delete físico (sem histórico a preservar)
                horarioRepository.delete(ativo);
            } else {
                // Versão anterior: fecha com ontem como data fim
                ativo.setDataFimVigencia(hoje.minusDays(1));
                horarioRepository.save(ativo);
            }
        }

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
            h.setDataInicioVigencia(hoje);
            horarioRepository.save(h);
            salvos.add(toMap(h));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensagem", "Horários salvos com sucesso",
                "total", salvos.size(),
                "horarios", salvos
        ));
    }

    // Listar horários filtrados pelo perfil do usuário logado (somente ativos)
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
                    .findByTurmaIdInAndDataFimVigenciaIsNullOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc(turmaIds);
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
                    .findByTurmaIdInAndDataFimVigenciaIsNullOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc(turmaIds);
            return ResponseEntity.ok(horarios.stream().map(this::toMap).toList());
        }

        // DIRECAO: todos ativos
        List<Horario> todos = horarioRepository
                .findByDataFimVigenciaIsNullOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc();
        return ResponseEntity.ok(todos.stream().map(this::toMap).toList());
    }

    // Listar TODOS os horários ativos
    @GetMapping
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR', 'ALUNO')")
    public ResponseEntity<?> listarTodos() {
        List<Horario> todos = horarioRepository
                .findByDataFimVigenciaIsNullOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc();
        return ResponseEntity.ok(todos.stream().map(this::toMap).toList());
    }

    // Listar horários ativos de uma turma específica
    @GetMapping("/turma/{turmaId}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR', 'ALUNO')")
    public ResponseEntity<?> listarPorTurma(@PathVariable Long turmaId) {
        List<Horario> horarios = horarioRepository
                .findByTurmaIdAndDataFimVigenciaIsNullOrderByOrdemAulaAsc(turmaId);
        return ResponseEntity.ok(horarios.stream().map(this::toMap).toList());
    }

    // Listar horários de uma turma num dia da semana.
    // Se ?data=YYYY-MM-DD for informado, retorna o horário vigente naquela data (histórico).
    // Sem ?data=, retorna o horário atualmente ativo.
    @GetMapping("/turma/{turmaId}/dia/{diaSemana}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR')")
    public ResponseEntity<?> listarPorTurmaDia(
            @PathVariable Long turmaId,
            @PathVariable String diaSemana,
            @RequestParam(required = false) String data) {
        List<Horario> horarios;
        if (data != null && !data.isBlank()) {
            LocalDate dataConsulta = LocalDate.parse(data);
            horarios = horarioRepository.findAtivosNaDataByTurmaAndDia(turmaId, diaSemana, dataConsulta);
        } else {
            horarios = horarioRepository
                    .findByTurmaIdAndDiaSemanaAndDataFimVigenciaIsNullOrderByOrdemAulaAsc(turmaId, diaSemana);
        }
        return ResponseEntity.ok(horarios.stream().map(this::toMap).toList());
    }

    // Deletar um horário individual (físico)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        if (!horarioRepository.existsById(id))
            return ResponseEntity.notFound().build();
        horarioRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Horário removido"));
    }

    // Deletar todos os horários de uma turma (físico — apaga histórico também)
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
        m.put("turmaSerieNome", h.getTurma().getSerie() != null ? h.getTurma().getSerie().getNome() : null);
        m.put("materiaId", h.getMateria().getId());
        m.put("materiaNome", h.getMateria().getNome());
        m.put("professorId", h.getProfessor().getId());
        m.put("professorNome", h.getProfessor().getNome());
        m.put("diaSemana", h.getDiaSemana());
        m.put("horarioInicio", h.getHorarioInicio());
        m.put("ordemAula", h.getOrdemAula());
        m.put("dataInicioVigencia", h.getDataInicioVigencia() != null ? h.getDataInicioVigencia().toString() : null);
        m.put("dataFimVigencia", h.getDataFimVigencia() != null ? h.getDataFimVigencia().toString() : null);
        return m;
    }
}
