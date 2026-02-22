package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/notas")
public class NotaController {

    @Autowired
    private NotaRepository notaRepository;

    @Autowired
    private AvaliacaoRepository avaliacaoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private MateriaRepository materiaRepository;

    // Professor cria uma avaliação
    @PostMapping("/avaliacao")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO')")
    public ResponseEntity<?> criarAvaliacao(@RequestBody Map<String, String> body) {
        Long turmaId = Long.parseLong(body.get("turmaId"));
        Long materiaId = Long.parseLong(body.get("materiaId"));
        String tipo = body.get("tipo");

        Optional<Turma> turma = turmaRepository.findById(turmaId);
        Optional<Materia> materia = materiaRepository.findById(materiaId);

        if (turma.isEmpty()) return ResponseEntity.badRequest().body("Turma não encontrada");
        if (materia.isEmpty()) return ResponseEntity.badRequest().body("Matéria não encontrada");
        if (!List.of("PROVA", "TRABALHO", "SIMULADO").contains(tipo)) {
            return ResponseEntity.badRequest().body("Tipo inválido. Use PROVA, TRABALHO ou SIMULADO");
        }

        Avaliacao avaliacao = new Avaliacao();
        avaliacao.setTurma(turma.get());
        avaliacao.setMateria(materia.get());
        avaliacao.setTipo(tipo);
        avaliacao.setDescricao(body.get("descricao"));
        avaliacao.setDataAplicacao(LocalDate.now());
        avaliacao.setPeso(new BigDecimal("1.0"));
        avaliacao.setBonificacao(tipo.equals("SIMULADO"));
        avaliacaoRepository.save(avaliacao);

        return ResponseEntity.status(HttpStatus.CREATED).body(avaliacao);
    }

    // Professor lança nota para um aluno
    @PostMapping("/lancar")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO')")
    public ResponseEntity<?> lancarNota(@RequestBody Map<String, String> body) {
        Long avaliacaoId = Long.parseLong(body.get("avaliacaoId"));
        Long alunoId = Long.parseLong(body.get("alunoId"));
        Double valor = Double.parseDouble(body.get("valor"));

        Optional<Avaliacao> avaliacao = avaliacaoRepository.findById(avaliacaoId);
        Optional<Usuario> aluno = usuarioRepository.findById(alunoId);

        if (avaliacao.isEmpty()) return ResponseEntity.badRequest().body("Avaliação não encontrada");
        if (aluno.isEmpty()) return ResponseEntity.badRequest().body("Aluno não encontrado");

        // Valida range de valor
        if (avaliacao.get().getBonificacao()) {
            if (valor < 0 || valor > 1)
                return ResponseEntity.badRequest().body("Simulado deve ser entre 0.00 e 1.00");
        } else {
            if (valor < 0 || valor > 10)
                return ResponseEntity.badRequest().body("Nota deve ser entre 0 e 10");
        }

        // Atualiza se já existe
        Optional<Nota> notaExistente = notaRepository.findByAvaliacaoIdAndAlunoId(avaliacaoId, alunoId);
        Nota nota = notaExistente.orElse(new Nota());
        nota.setAvaliacao(avaliacao.get());
        nota.setAluno(aluno.get());
        nota.setValor(valor);
        nota.setLancadoEm(LocalDateTime.now());
        notaRepository.save(nota);

        return ResponseEntity.ok(Map.of("mensagem", "Nota lançada com sucesso", "valor", valor));
    }

    // Busca média de um aluno por matéria e turma
    @GetMapping("/media/{alunoId}/{turmaId}/{materiaId}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'ALUNO')")
    public ResponseEntity<?> calcularMedia(@PathVariable Long alunoId,
                                           @PathVariable Long turmaId,
                                           @PathVariable Long materiaId) {
        List<Nota> notas = notaRepository
                .findByAlunoIdAndAvaliacaoTurmaIdAndAvaliacaoMateriaId(alunoId, turmaId, materiaId);

        if (notas.isEmpty()) return ResponseEntity.ok(Map.of("media", 0.0, "bonus", 0.0));

        double somaNotas = 0;
        double bonus = 0;
        int count = 0;

        for (Nota nota : notas) {
            if (nota.getAvaliacao().getBonificacao()) {
                bonus += nota.getValor();
            } else {
                somaNotas += nota.getValor();
                count++;
            }
        }

        double media = count > 0 ? somaNotas / count : 0;
        double mediaFinal = media + bonus;

        return ResponseEntity.ok(Map.of(
                "media", Math.round(media * 100.0) / 100.0,
                "bonus", Math.round(bonus * 100.0) / 100.0,
                "mediaFinal", Math.round(mediaFinal * 100.0) / 100.0
        ));
    }

    // Aluno vê suas próprias notas
    @GetMapping("/minhas")
    @PreAuthorize("hasRole('ALUNO')")
    public ResponseEntity<?> minhasNotas(Authentication auth) {
        String login = auth.getName();
        Optional<Usuario> aluno = usuarioRepository.findByLogin(login);
        if (aluno.isEmpty()) return ResponseEntity.badRequest().body("Aluno não encontrado");

        List<Nota> notas = notaRepository.findByAlunoId(aluno.get().getId());
        return ResponseEntity.ok(notas);
    }
}