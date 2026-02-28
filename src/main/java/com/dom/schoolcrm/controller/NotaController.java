package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import com.dom.schoolcrm.entity.Presenca;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
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

    @Autowired
    private com.dom.schoolcrm.repository.PresencaRepository presencaRepository;

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
        String pesoStr = body.get("peso");
        avaliacao.setPeso(pesoStr != null && !pesoStr.isBlank() ? new BigDecimal(pesoStr) : new BigDecimal("1.0"));
        avaliacao.setBonificacao(tipo.equals("SIMULADO"));
        String bimestreStr = body.get("bimestre");
        if (bimestreStr != null && !bimestreStr.isBlank()) {
            avaliacao.setBimestre(Integer.parseInt(bimestreStr));
        }
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

    @GetMapping("/avaliacoes")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO')")
    public ResponseEntity<?> listarAvaliacoesComNotas(
            @RequestParam Long turmaId,
            @RequestParam Long materiaId) {

        List<Avaliacao> avaliacoes = avaliacaoRepository.findByTurmaIdAndMateriaId(turmaId, materiaId);

        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Avaliacao av : avaliacoes) {
            List<Nota> notas = notaRepository.findByAvaliacaoId(av.getId());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", av.getId());
            item.put("tipo", av.getTipo());
            item.put("descricao", av.getDescricao());
            item.put("dataAplicacao", av.getDataAplicacao());
            item.put("peso", av.getPeso());
            item.put("bonificacao", av.getBonificacao());
            item.put("bimestre", av.getBimestre() != null ? av.getBimestre() : 1);
            item.put("notas", notas.stream().map(n -> Map.of(
                    "alunoId", n.getAluno().getId(),
                    "alunoNome", n.getAluno().getNome(),
                    "valor", n.getValor(),
                    "notaId", n.getId()
            )).toList());
            resultado.add(item);
        }
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/boletim/{alunoId}/{turmaId}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO')")
    public ResponseEntity<?> gerarBoletim(@PathVariable Long alunoId, @PathVariable Long turmaId) {
        var alunoOpt = usuarioRepository.findById(alunoId);
        var turmaOpt = turmaRepository.findById(turmaId);
        if (alunoOpt.isEmpty() || turmaOpt.isEmpty())
            return ResponseEntity.badRequest().body("Aluno ou turma não encontrado");

        // Busca todas as notas do aluno nessa turma
        List<Nota> todasNotas = notaRepository.findByAlunoId(alunoId).stream()
                .filter(n -> n.getAvaliacao().getTurma().getId().equals(turmaId))
                .toList();

        // Busca todas as presenças do aluno nessa turma
        List<com.dom.schoolcrm.entity.Presenca> todasPresencas = presencaRepository
                .findAll().stream()
                .filter(p -> p.getAluno().getId().equals(alunoId) && p.getTurma().getId().equals(turmaId))
                .toList();

        // Agrupa por matéria
        Map<Long, Map<String, Object>> porMateria = new LinkedHashMap<>();

        for (Nota nota : todasNotas) {
            Long matId = nota.getAvaliacao().getMateria().getId();
            String matNome = nota.getAvaliacao().getMateria().getNome();
            porMateria.computeIfAbsent(matId, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("materiaId", matId);
                m.put("materiaNome", matNome);
                m.put("bimestres", new java.util.TreeMap<Integer, Map<String,Object>>());
                return m;
            });

            @SuppressWarnings("unchecked")
            java.util.TreeMap<Integer, Map<String,Object>> bimestres =
                    (java.util.TreeMap<Integer, Map<String,Object>>) porMateria.get(matId).get("bimestres");

            Integer bim = nota.getAvaliacao().getBimestre() != null ? nota.getAvaliacao().getBimestre() : 1;
            bimestres.computeIfAbsent(bim, k -> {
                Map<String,Object> b = new LinkedHashMap<>();
                b.put("notas", new ArrayList<Map<String,Object>>());
                b.put("faltas", 0);
                return b;
            });

            @SuppressWarnings("unchecked")
            List<Map<String,Object>> notasList = (List<Map<String,Object>>) bimestres.get(bim).get("notas");
            notasList.add(Map.of(
                    "valor", nota.getValor(),
                    "tipo", nota.getAvaliacao().getTipo(),
                    "peso", nota.getAvaliacao().getPeso(),
                    "bonificacao", nota.getAvaliacao().getBonificacao()
            ));
        }

        // Conta faltas por matéria/bimestre (simplificado: conta por data/matéria)
        for (com.dom.schoolcrm.entity.Presenca p : todasPresencas) {
            if (!p.getPresente()) {
                Long matId = p.getMateria().getId();
                if (porMateria.containsKey(matId)) {
                    // faltas totais por matéria (sem bimestre)
                    Map<String,Object> mat = porMateria.get(matId);
                    int faltas = mat.containsKey("totalFaltas") ? (int) mat.get("totalFaltas") : 0;
                    mat.put("totalFaltas", faltas + 1);
                }
            }
        }

        // Calcula médias por bimestre e média anual
        for (Map<String,Object> mat : porMateria.values()) {
            @SuppressWarnings("unchecked")
            java.util.TreeMap<Integer, Map<String,Object>> bimestres =
                    (java.util.TreeMap<Integer, Map<String,Object>>) mat.get("bimestres");

            BigDecimal somaMedias = BigDecimal.ZERO;
            int countBim = 0;
            BigDecimal bonusTotal = BigDecimal.ZERO;

            for (Map.Entry<Integer, Map<String,Object>> entry : bimestres.entrySet()) {
                @SuppressWarnings("unchecked")
                List<Map<String,Object>> notas = (List<Map<String,Object>>) entry.getValue().get("notas");

                BigDecimal somaPonderada = BigDecimal.ZERO;
                BigDecimal somaPesos = BigDecimal.ZERO;
                BigDecimal bonus = BigDecimal.ZERO;

                for (Map<String,Object> n : notas) {
                    boolean isBon = (boolean) n.get("bonificacao");
                    BigDecimal val = (BigDecimal) n.get("valor");
                    BigDecimal peso = (BigDecimal) n.get("peso");
                    if (isBon) { bonus = bonus.add(val); }
                    else { somaPonderada = somaPonderada.add(val.multiply(peso)); somaPesos = somaPesos.add(peso); }
                }

                BigDecimal media = somaPesos.compareTo(BigDecimal.ZERO) > 0
                        ? somaPonderada.divide(somaPesos, 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
                BigDecimal mediaComBonus = media.add(bonus)
                        .min(BigDecimal.TEN)
                        .setScale(1, RoundingMode.HALF_UP);

                entry.getValue().put("media", mediaComBonus);
                bonusTotal = bonusTotal.add(bonus);
                if (somaPesos.compareTo(BigDecimal.ZERO) > 0) { somaMedias = somaMedias.add(mediaComBonus); countBim++; }
            }

            BigDecimal mediaAnual = countBim > 0
                    ? somaMedias.divide(new BigDecimal(countBim), 1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            mat.put("mediaAnual", mediaAnual);
            mat.put("totalFaltas", mat.getOrDefault("totalFaltas", 0));

            // frequência por matéria
            long totalAulas = todasPresencas.stream()
                    .filter(p -> p.getMateria().getId().equals(mat.get("materiaId")))
                    .count();
            long faltasMateria = todasPresencas.stream()
                    .filter(p -> p.getMateria().getId().equals(mat.get("materiaId")) && !p.getPresente())
                    .count();
            double freqMateria = totalAulas > 0
                    ? Math.round((totalAulas - faltasMateria) * 1000.0 / totalAulas) / 10.0
                    : 100.0;
            mat.put("totalAulas", totalAulas);
            mat.put("faltasMateria", faltasMateria);
            mat.put("frequenciaMateria", freqMateria);
        }

        // Frequência geral
        long totalAulasGeral = todasPresencas.size();
        long faltasGeral = todasPresencas.stream().filter(p -> !p.getPresente()).count();
        double freqGeral = totalAulasGeral > 0 ? Math.round((totalAulasGeral - faltasGeral) * 1000.0 / totalAulasGeral) / 10.0 : 100.0;

        return ResponseEntity.ok(Map.of(
                "aluno", Map.of("id", alunoOpt.get().getId(), "nome", alunoOpt.get().getNome()),
                "turma", Map.of("id", turmaOpt.get().getId(), "nome", turmaOpt.get().getNome(),
                        "serie", turmaOpt.get().getSerie() != null ? turmaOpt.get().getSerie().getNome() : "",
                        "anoLetivo", turmaOpt.get().getAnoLetivo()),
                "disciplinas", new ArrayList<>(porMateria.values()),
                "frequenciaGeral", freqGeral,
                "totalFaltasGeral", faltasGeral
        ));
    }

    @DeleteMapping("/avaliacao/{id}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO')")
    @Transactional
    public ResponseEntity<?> deletarAvaliacao(@PathVariable Long id) {
        if (!avaliacaoRepository.existsById(id))
            return ResponseEntity.notFound().build();

        notaRepository.deleteAll(notaRepository.findByAvaliacaoId(id));
        avaliacaoRepository.deleteById(id);

        return ResponseEntity.ok(Map.of("mensagem", "Avaliação e notas removidas com sucesso"));
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