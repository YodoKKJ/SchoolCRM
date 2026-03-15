package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import java.util.LinkedHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/presencas")
public class PresencaController {

    @Autowired
    private PresencaRepository presencaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private MateriaRepository materiaRepository;

    // Professor lança presença
    @PostMapping("/lancar")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
    @Transactional
    public ResponseEntity<?> lancarPresenca(@RequestBody Map<String, String> body) {
        Long alunoId;
        Long turmaId;
        Long materiaId;
        LocalDate data;
        try {
            alunoId   = Long.parseLong(body.get("alunoId"));
            turmaId   = Long.parseLong(body.get("turmaId"));
            materiaId = Long.parseLong(body.get("materiaId"));
        } catch (NumberFormatException | NullPointerException e) {
            return ResponseEntity.badRequest().body("alunoId, turmaId e materiaId são obrigatórios e devem ser numéricos.");
        }
        try {
            data = LocalDate.parse(body.get("data"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("data é obrigatória e deve estar no formato YYYY-MM-DD.");
        }

        if (body.get("presente") == null) {
            return ResponseEntity.badRequest().body("presente é obrigatório (true ou false).");
        }
        Boolean presente = Boolean.parseBoolean(body.get("presente"));

        // Permite até +1 dia para cobrir diferenças de fuso horário entre cliente e servidor
        if (data.isAfter(LocalDate.now().plusDays(1)))
            return ResponseEntity.badRequest().body("Não é possível lançar presença para data futura");

        // Campos opcionais para presença por período (null = registro legado)
        String ordemAulaStr = body.get("ordemAula");
        Integer ordemAula = null;
        if (ordemAulaStr != null && !ordemAulaStr.isBlank() && !"null".equals(ordemAulaStr)) {
            try {
                ordemAula = Integer.parseInt(ordemAulaStr);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("ordemAula deve ser um número inteiro.");
            }
        }
        String horarioInicio = body.get("horarioInicio");
        if ("null".equals(horarioInicio)) horarioInicio = null;

        Optional<Usuario> aluno = usuarioRepository.findById(alunoId);
        Optional<Turma> turma = turmaRepository.findById(turmaId);
        Optional<Materia> materia = materiaRepository.findById(materiaId);

        if (aluno.isEmpty()) return ResponseEntity.badRequest().body("Aluno não encontrado");
        if (turma.isEmpty()) return ResponseEntity.badRequest().body("Turma não encontrada");
        if (materia.isEmpty()) return ResponseEntity.badRequest().body("Matéria não encontrada");

        try {
            // Upsert: por período específico quando ordemAula presente; legado caso contrário
            Optional<Presenca> existente = (ordemAula != null)
                    ? presencaRepository.findByAlunoIdAndMateriaIdAndDataAndOrdemAula(alunoId, materiaId, data, ordemAula)
                    : presencaRepository.findFirstByAlunoIdAndMateriaIdAndData(alunoId, materiaId, data);

            Presenca presenca = existente.orElse(new Presenca());
            presenca.setAluno(aluno.get());
            presenca.setTurma(turma.get());
            presenca.setMateria(materia.get());
            presenca.setData(data);
            presenca.setPresente(presente);
            presenca.setOrdemAula(ordemAula);
            presenca.setHorarioInicio(horarioInicio);
            presencaRepository.save(presenca);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao salvar presença: " + e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("mensagem", "Presença lançada com sucesso",
                        "presente", presente,
                        "data", data.toString()));
    }

    // Listar presenças de um aluno por turma e matéria
    @GetMapping("/{alunoId}/{turmaId}/{materiaId}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'ALUNO')")
    public ResponseEntity<?> listarPresencas(@PathVariable Long alunoId,
                                             @PathVariable Long turmaId,
                                             @PathVariable Long materiaId,
                                             Authentication auth) {
        // ALUNO só pode consultar suas próprias presenças
        boolean isAluno = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ALUNO"));
        if (isAluno) {
            Optional<Usuario> autenticado = usuarioRepository.findByLogin(auth.getName());
            if (autenticado.isEmpty() || !autenticado.get().getId().equals(alunoId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
            }
        }

        List<Presenca> presencas = presencaRepository
                .findByAlunoIdAndTurmaIdAndMateriaId(alunoId, turmaId, materiaId);

        // Exclui registros com presente=null (dados incompletos não devem influenciar o percentual)
        List<Presenca> comValor = presencas.stream().filter(p -> p.getPresente() != null).toList();
        long total = comValor.size();
        long presentes = comValor.stream().filter(p -> Boolean.TRUE.equals(p.getPresente())).count();
        double percentual = total > 0 ? (presentes * 100.0 / total) : 0;

        return ResponseEntity.ok(Map.of(
                "presencas", presencas,
                "totalAulas", total,
                "presentes", presentes,
                "faltas", total - presentes,
                "percentualPresenca", Math.round(percentual * 100.0) / 100.0
        ));
    }

    // Listar chamada da turma em uma data específica (ou listar todas as datas de uma turma/matéria)
    @GetMapping("/turma/{turmaId}/materia/{materiaId}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> presencasPorTurmaEMateria(
            @PathVariable Long turmaId,
            @PathVariable Long materiaId) {

        List<Presenca> todas = presencaRepository.findByTurmaIdAndMateriaId(turmaId, materiaId);

        // Agrupa por data, incluindo ordemAula/horarioInicio (null em registros legados)
        Map<String, List<Map<String,Object>>> porData = new java.util.TreeMap<>();
        for (Presenca p : todas) {
            String data = p.getData().toString();
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("alunoId", p.getAluno().getId());
            record.put("alunoNome", p.getAluno().getNome());
            record.put("presente", p.getPresente());
            record.put("presencaId", p.getId());
            record.put("ordemAula", p.getOrdemAula());
            record.put("horarioInicio", p.getHorarioInicio());
            porData.computeIfAbsent(data, k -> new ArrayList<>()).add(record);
        }
        return ResponseEntity.ok(porData);
    }

    // Aluno vê suas próprias presenças
    @GetMapping("/minhas/{turmaId}/{materiaId}")
    @PreAuthorize("hasRole('ALUNO')")
    public ResponseEntity<?> minhasPresencas(Authentication auth,
                                             @PathVariable Long turmaId,
                                             @PathVariable Long materiaId) {
        String login = auth.getName();
        Optional<Usuario> aluno = usuarioRepository.findByLogin(login);
        if (aluno.isEmpty()) return ResponseEntity.badRequest().body("Aluno não encontrado");

        List<Presenca> presencas = presencaRepository
                .findByAlunoIdAndTurmaIdAndMateriaId(aluno.get().getId(), turmaId, materiaId);

        // Exclui registros com presente=null (dados incompletos não devem influenciar o percentual)
        List<Presenca> comValor = presencas.stream().filter(p -> p.getPresente() != null).toList();
        long total = comValor.size();
        long presentes = comValor.stream().filter(p -> Boolean.TRUE.equals(p.getPresente())).count();
        double percentual = total > 0 ? (presentes * 100.0 / total) : 0;

        return ResponseEntity.ok(Map.of(
                "totalAulas", total,
                "presentes", presentes,
                "faltas", total - presentes,
                "percentualPresenca", Math.round(percentual * 100.0) / 100.0
        ));
    }
}