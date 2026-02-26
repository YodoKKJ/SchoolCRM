package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/atrasos")
public class AtrasoController {

    @Autowired private AtrasoRepository atrasoRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private AlunoTurmaRepository alunoTurmaRepository;
    @Autowired private TurmaRepository turmaRepository;

    @PostMapping
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> registrar(@RequestBody Map<String, String> body) {
        Long alunoId = Long.parseLong(body.get("alunoId"));

        Optional<Usuario> aluno = usuarioRepository.findById(alunoId);
        if (aluno.isEmpty() || !aluno.get().getRole().equals("ALUNO"))
            return ResponseEntity.badRequest().body("Aluno não encontrado");

        // Data opcional — padrão: hoje
        String dataStr = body.get("data");
        LocalDate dataRegistro = (dataStr != null && !dataStr.isBlank())
                ? LocalDate.parse(dataStr)
                : LocalDate.now();

        // Busca turma do aluno automaticamente
        var vinculos = alunoTurmaRepository.findByAlunoId(alunoId);
        Turma turma = vinculos.isEmpty() ? null : vinculos.get(0).getTurma();

        // Verifica se já tem atraso no dia especificado
        LocalDateTime inicioDia = dataRegistro.atStartOfDay();
        LocalDateTime fimDia = inicioDia.plusDays(1);
        List<Atraso> doDia = atrasoRepository.findByData(inicioDia, fimDia);
        boolean jaTemNoDia = doDia.stream().anyMatch(a -> a.getAluno().getId().equals(alunoId));
        if (jaTemNoDia)
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Aluno já tem atraso registrado neste dia");

        LocalDateTime registradoEm = dataRegistro.atTime(LocalDateTime.now().toLocalTime());

        Atraso atraso = new Atraso();
        atraso.setAluno(aluno.get());
        atraso.setTurma(turma);
        atraso.setRegistradoEm(registradoEm);
        atraso.setObservacao(body.getOrDefault("observacao", ""));
        atrasoRepository.save(atraso);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", atraso.getId(),
            "aluno", aluno.get().getNome(),
            "turma", turma != null ? turma.getNome() : "",
            "horario", registradoEm.format(DateTimeFormatter.ofPattern("HH:mm")),
            "registradoEm", registradoEm.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
            "mensagem", "Atraso registrado com sucesso"
        ));
    }

    @GetMapping("/hoje")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> hoje() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fim = inicio.plusDays(1);
        List<Atraso> atrasos = atrasoRepository.findByData(inicio, fim);
        return ResponseEntity.ok(atrasos.stream().map(this::toMap).toList());
    }

    @GetMapping("/historico")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> historico(
            @RequestParam(required = false) String data) {
        if (data != null && !data.isBlank()) {
            LocalDate dia = LocalDate.parse(data);
            List<Atraso> atrasos = atrasoRepository.findByData(dia.atStartOfDay(), dia.plusDays(1).atStartOfDay());
            return ResponseEntity.ok(atrasos.stream().map(this::toMap).toList());
        }
        return ResponseEntity.ok(atrasoRepository.findAllByOrderByRegistradoEmDesc()
                .stream().map(this::toMap).toList());
    }

    @GetMapping("/aluno/{alunoId}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> porAluno(@PathVariable Long alunoId) {
        return ResponseEntity.ok(
            atrasoRepository.findByAlunoIdOrderByRegistradoEmDesc(alunoId)
                .stream().map(this::toMap).toList()
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        if (!atrasoRepository.existsById(id))
            return ResponseEntity.notFound().build();
        atrasoRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Atraso removido"));
    }

    private Map<String, Object> toMap(Atraso a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("alunoId", a.getAluno().getId());
        m.put("alunoNome", a.getAluno().getNome());
        m.put("turma", a.getTurma() != null ? a.getTurma().getNome() : "—");
        m.put("registradoEm", a.getRegistradoEm().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
        m.put("data", a.getRegistradoEm().toLocalDate().toString());
        m.put("horario", a.getRegistradoEm().format(DateTimeFormatter.ofPattern("HH:mm")));
        m.put("observacao", a.getObservacao() != null ? a.getObservacao() : "");
        return m;
    }
}
