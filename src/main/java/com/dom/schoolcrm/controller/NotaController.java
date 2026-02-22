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
import java.math.RoundingMode;
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

    @PostMapping("/lancar")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO')")
    public ResponseEntity<?> lancarNota(@RequestBody Map<String, String> body) {
        Long avaliacaoId = Long.parseLong(body.get("avaliacaoId"));
        Long alunoId = Long.parseLong(body.get("alunoId"));
        BigDecimal valor = new BigDecimal(body.get("valor"));

        Optional<Avaliacao> avaliacao = avaliacaoRepository.findById(avaliacaoId);
        Optional<Usuario> aluno = usuarioRepository.findById(alunoId);

        if (avaliacao.isEmpty()) return ResponseEntity.badRequest().body("Avaliação não encontrada");
        if (aluno.isEmpty()) return ResponseEntity.badRequest().body("Aluno não encontrado");

        if (avaliacao.get().getBonificacao()) {
            if (valor.compareTo(BigDecimal.ZERO) < 0 || valor.compareTo(BigDecimal.ONE) > 0)
                return ResponseEntity.badRequest().body("Simulado deve ser entre 0.00 e 1.00");
        } else {
            if (valor.compareTo(BigDecimal.ZERO) < 0 || valor.compareTo(new BigDecimal("10")) > 0)
                return ResponseEntity.badRequest().body("Nota deve ser entre 0 e 10");
        }

        Optional<Nota> notaExistente = notaRepository.findByAvaliacaoIdAndAlunoId(avaliacaoId, alunoId);
        Nota nota = notaExistente.orElse(new Nota());
        nota.setAvaliacao(avaliacao.get());
        nota.setAluno(aluno.get());
        nota.setValor(valor);
        nota.setLancadoEm(LocalDateTime.now());
        notaRepository.save(nota);

        return ResponseEntity.ok(Map.of("mensagem", "Nota lançada com sucesso", "valor", valor));
    }

    @GetMapping("/media/{alunoId}/{turmaId}/{materiaId}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'ALUNO')")
    public ResponseEntity<?> calcularMedia(@PathVariable Long alunoId,
                                           @PathVariable Long turmaId,
                                           @PathVariable Long materiaId) {
        List<Nota> notas = notaRepository
                .findByAlunoIdAndAvaliacaoTurmaIdAndAvaliacaoMateriaId(alunoId, turmaId, materiaId);

        if (notas.isEmpty()) return ResponseEntity.ok(Map.of("media", 0.0, "bonus", 0.0, "mediaFinal", 0.0));

        BigDecimal somaNotas = BigDecimal.ZERO;
        BigDecimal bonus = BigDecimal.ZERO;
        int count = 0;

        for (Nota nota : notas) {
            if (nota.getAvaliacao().getBonificacao()) {
                bonus = bonus.add(nota.getValor());
            } else {
                somaNotas = somaNotas.add(nota.getValor());
                count++;
            }
        }

        BigDecimal media = count > 0 ? somaNotas.divide(new BigDecimal(count), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal mediaFinal = media.add(bonus).setScale(2, RoundingMode.HALF_UP);

        return ResponseEntity.ok(Map.of(
                "media", media,
                "bonus", bonus,
                "mediaFinal", mediaFinal
        ));
    }

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