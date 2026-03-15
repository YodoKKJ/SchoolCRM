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

// v2 — suporte a RECUPERACAO (2026-03-03)
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

    @Autowired
    private RecuperacaoParticipanteRepository recuperacaoParticipanteRepository;

    @Autowired
    private com.dom.schoolcrm.service.AuditService auditService;

    @Autowired
    private com.dom.schoolcrm.repository.AlunoTurmaRepository alunoTurmaRepository;

    @Autowired
    private com.dom.schoolcrm.repository.FinConfiguracaoRepository finConfiguracaoRepository;

    private double getMediaMinima() {
        return finConfiguracaoRepository.findAll().stream().findFirst()
                .map(c -> c.getMediaMinima() != null ? c.getMediaMinima().doubleValue() : 6.0)
                .orElse(6.0);
    }

    private double getFreqMinima() {
        return finConfiguracaoRepository.findAll().stream().findFirst()
                .map(c -> c.getFreqMinima() != null ? c.getFreqMinima().doubleValue() : 75.0)
                .orElse(75.0);
    }

    /**
     * Retorna os parâmetros acadêmicos (mediaMinima e freqMinima) para qualquer
     * usuário autenticado — usado pelo AlunoDashboard, ProfessorDashboard, etc.
     * Não expõe dados financeiros sensíveis (juros, multa) do FinConfiguracao.
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfigAcademica() {
        return ResponseEntity.ok(Map.of(
                "mediaMinima", getMediaMinima(),
                "freqMinima",  getFreqMinima()
        ));
    }

    @PostMapping("/avaliacao")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> criarAvaliacao(@RequestBody Map<String, String> body, Authentication auth) {
        Long turmaId;
        Long materiaId;
        try {
            turmaId   = Long.parseLong(body.get("turmaId"));
            materiaId = Long.parseLong(body.get("materiaId"));
        } catch (NumberFormatException | NullPointerException e) {
            return ResponseEntity.badRequest().body("turmaId e materiaId são obrigatórios e devem ser numéricos.");
        }


        String tipo = body.get("tipo");
        if (!List.of("PROVA", "TRABALHO", "SIMULADO", "RECUPERACAO").contains(tipo)) {
            return ResponseEntity.badRequest().body("Tipo inválido. Use PROVA, TRABALHO, SIMULADO ou RECUPERACAO");
        }

        Optional<Turma> turma = turmaRepository.findById(turmaId);
        Optional<Materia> materia = materiaRepository.findById(materiaId);

        if (turma.isEmpty()) return ResponseEntity.badRequest().body("Turma não encontrada");
        if (materia.isEmpty()) return ResponseEntity.badRequest().body("Matéria não encontrada");

        Avaliacao avaliacao = new Avaliacao();
        avaliacao.setTurma(turma.get());
        avaliacao.setMateria(materia.get());
        avaliacao.setTipo(tipo);
        avaliacao.setDescricao(body.get("descricao"));
        String dataAplic = body.get("dataAplicacao");
        if (dataAplic != null && !dataAplic.isBlank()) {
            LocalDate dataAvaliacao = LocalDate.parse(dataAplic);
            if (dataAvaliacao.isAfter(LocalDate.now().plusYears(1))) {
                return ResponseEntity.badRequest().body("Data de aplicação não pode ser superior a 1 ano no futuro.");
            }
            avaliacao.setDataAplicacao(dataAvaliacao);
        } else {
            avaliacao.setDataAplicacao(LocalDate.now());
        }

        if ("RECUPERACAO".equals(tipo) || "SIMULADO".equals(tipo)) {
            avaliacao.setPeso(new BigDecimal("1.0"));
            avaliacao.setBonificacao("SIMULADO".equals(tipo));
        } else {
            String pesoStr = body.get("peso");
            if (pesoStr != null && !pesoStr.isBlank()) {
                try {
                    BigDecimal peso = new BigDecimal(pesoStr);
                    if (peso.compareTo(new BigDecimal("0.1")) < 0 || peso.compareTo(BigDecimal.TEN) > 0) {
                        return ResponseEntity.badRequest().body("Peso deve ser entre 0.1 e 10.");
                    }
                    avaliacao.setPeso(peso);
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body("Peso inválido.");
                }
            } else {
                avaliacao.setPeso(new BigDecimal("1.0"));
            }
            avaliacao.setBonificacao(false);
        }

        String bimestreStr = body.get("bimestre");
        if (bimestreStr != null && !bimestreStr.isBlank()) {
            try {
                int bimestre = Integer.parseInt(bimestreStr);
                if (bimestre < 1 || bimestre > 4) {
                    return ResponseEntity.badRequest().body("Bimestre deve ser entre 1 e 4.");
                }
                avaliacao.setBimestre(bimestre);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("Bimestre inválido.");
            }
        } else {
            return ResponseEntity.badRequest().body("bimestre é obrigatório (1 a 4).");
        }
        avaliacaoRepository.save(avaliacao);
        auditService.log(auth, "CRIAR", "AVALIACAO", String.valueOf(avaliacao.getId()),
                "Tipo=" + avaliacao.getTipo() + " Turma=" + turmaId + " Materia=" + materiaId + " Bimestre=" + avaliacao.getBimestre());
        return ResponseEntity.status(HttpStatus.CREATED).body(avaliacao);
    }

    @PutMapping("/avaliacao/{id}/participantes")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
    @Transactional
    public ResponseEntity<?> atualizarParticipantes(@PathVariable Long id,
                                                     @RequestBody Map<String, List<Long>> body) {
        Optional<Avaliacao> avOpt = avaliacaoRepository.findById(id);
        if (avOpt.isEmpty()) return ResponseEntity.notFound().build();
        if (!"RECUPERACAO".equals(avOpt.get().getTipo()))
            return ResponseEntity.badRequest().body("Apenas avaliações do tipo RECUPERACAO têm participantes");

        List<Long> alunoIds = body.getOrDefault("alunoIds", List.of());

        Long turmaIdRecup = avOpt.get().getTurma().getId();
        // Pré-carrega alunos da turma para validar pertencimento sem N+1
        Set<Long> alunosDaTurma = alunoTurmaRepository.findByTurmaId(turmaIdRecup).stream()
                .map(at -> at.getAluno().getId())
                .collect(java.util.stream.Collectors.toSet());

        recuperacaoParticipanteRepository.deleteByAvaliacaoId(id);

        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Long alunoId : alunoIds) {
            Optional<Usuario> alunoOpt = usuarioRepository.findById(alunoId);
            if (alunoOpt.isEmpty()) continue;
            // Garante que o aluno pertence à turma da avaliação
            if (!alunosDaTurma.contains(alunoId)) continue;
            RecuperacaoParticipante rp = new RecuperacaoParticipante();
            rp.setAvaliacao(avOpt.get());
            rp.setAluno(alunoOpt.get());
            recuperacaoParticipanteRepository.save(rp);
            resultado.add(Map.of("alunoId", alunoId, "alunoNome", alunoOpt.get().getNome()));
        }

        return ResponseEntity.ok(Map.of("participantes", resultado));
    }

    @PostMapping("/lancar")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> lancarNota(@RequestBody Map<String, String> body, Authentication auth) {
        Long avaliacaoId;
        Long alunoId;
        BigDecimal valor;
        try {
            avaliacaoId = Long.parseLong(body.get("avaliacaoId"));
            alunoId     = Long.parseLong(body.get("alunoId"));
            valor       = new BigDecimal(body.get("valor"));
        } catch (NumberFormatException | NullPointerException e) {
            return ResponseEntity.badRequest().body("avaliacaoId, alunoId e valor são obrigatórios e devem ser numéricos.");
        }

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
        auditService.log(auth, "LANCAR", "NOTA", String.valueOf(nota.getId()),
                "AvaliacaoId=" + avaliacaoId + " AlunoId=" + alunoId + " Valor=" + valor);

        return ResponseEntity.ok(Map.of("mensagem", "Nota lançada com sucesso", "valor", valor));
    }

    @GetMapping("/media/{alunoId}/{turmaId}/{materiaId}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'ALUNO')")
    public ResponseEntity<?> calcularMedia(@PathVariable Long alunoId,
                                           @PathVariable Long turmaId,
                                           @PathVariable Long materiaId,
                                           Authentication auth) {
        // ALUNO só pode consultar suas próprias notas
        boolean isAluno = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ALUNO"));
        if (isAluno) {
            Optional<Usuario> autenticado = usuarioRepository.findByLogin(auth.getName());
            if (autenticado.isEmpty() || !autenticado.get().getId().equals(alunoId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
            }
        }

        List<Nota> notas = notaRepository
                .findByAlunoIdAndAvaliacaoTurmaIdAndAvaliacaoMateriaId(alunoId, turmaId, materiaId);

        if (notas.isEmpty()) return ResponseEntity.ok(Map.of("media", 0.0, "bonus", 0.0, "mediaFinal", 0.0));

        BigDecimal somaPonderada = BigDecimal.ZERO;
        BigDecimal somaPesos    = BigDecimal.ZERO;
        BigDecimal bonus        = BigDecimal.ZERO;
        BigDecimal recuperacao  = null;   // nota de recuperação substitui média se maior

        for (Nota nota : notas) {
            String tipo  = nota.getAvaliacao().getTipo();
            BigDecimal val  = nota.getValor();
            BigDecimal peso = nota.getAvaliacao().getPeso();

            if ("RECUPERACAO".equals(tipo)) {
                recuperacao = val;
            } else if (nota.getAvaliacao().getBonificacao()) {
                bonus = bonus.add(val);
            } else {
                somaPonderada = somaPonderada.add(val.multiply(peso));
                somaPesos = somaPesos.add(peso);
            }
        }

        BigDecimal media = somaPesos.compareTo(BigDecimal.ZERO) > 0
                ? somaPonderada.divide(somaPesos, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Recuperação: mantém a maior entre a média calculada e a nota de recuperação
        if (recuperacao != null) {
            media = media.max(recuperacao);
        }

        BigDecimal mediaFinal = media.add(bonus)
                .min(BigDecimal.TEN)
                .setScale(2, RoundingMode.HALF_UP);

        return ResponseEntity.ok(Map.of(
                "media", media.setScale(2, RoundingMode.HALF_UP),
                "bonus", bonus,
                "recuperacao", recuperacao != null ? recuperacao : BigDecimal.ZERO,
                "mediaFinal", mediaFinal
        ));
    }

    @GetMapping("/avaliacoes")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
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

            if ("RECUPERACAO".equals(av.getTipo())) {
                List<RecuperacaoParticipante> participantes =
                        recuperacaoParticipanteRepository.findByAvaliacaoId(av.getId());
                item.put("recuperacaoParticipantes", participantes.stream().map(rp -> Map.of(
                        "alunoId", rp.getAluno().getId(),
                        "alunoNome", rp.getAluno().getNome()
                )).toList());
            } else {
                item.put("recuperacaoParticipantes", List.of());
            }

            resultado.add(item);
        }
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/boletim/{alunoId}/{turmaId}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> gerarBoletim(@PathVariable Long alunoId, @PathVariable Long turmaId) {
        var alunoOpt = usuarioRepository.findById(alunoId);
        var turmaOpt = turmaRepository.findById(turmaId);
        if (alunoOpt.isEmpty() || turmaOpt.isEmpty())
            return ResponseEntity.badRequest().body("Aluno ou turma não encontrado");

        List<Nota> todasNotas = notaRepository.findByAlunoId(alunoId).stream()
                .filter(n -> n.getAvaliacao().getTurma().getId().equals(turmaId))
                .toList();

        List<com.dom.schoolcrm.entity.Presenca> todasPresencas = presencaRepository
                .findByAlunoIdAndTurmaId(alunoId, turmaId);

        Map<Long, Map<String, Object>> porMateria = new LinkedHashMap<>();

        // Inicializar entradas para matérias com presenças registradas mas sem notas
        // (garante que disciplinas com 100% de falta apareçam no boletim)
        for (com.dom.schoolcrm.entity.Presenca p : todasPresencas) {
            Long matId = p.getMateria().getId();
            porMateria.computeIfAbsent(matId, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("materiaId", matId);
                m.put("materiaNome", p.getMateria().getNome());
                m.put("bimestres", new java.util.TreeMap<Integer, Map<String,Object>>());
                return m;
            });
        }

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

        for (com.dom.schoolcrm.entity.Presenca p : todasPresencas) {
            if (!Boolean.TRUE.equals(p.getPresente())) {
                Long matId = p.getMateria().getId();
                if (porMateria.containsKey(matId)) {
                    Map<String,Object> mat = porMateria.get(matId);
                    int faltas = mat.containsKey("totalFaltas") ? (int) mat.get("totalFaltas") : 0;
                    mat.put("totalFaltas", faltas + 1);
                }
            }
        }

        for (Map<String,Object> mat : porMateria.values()) {
            @SuppressWarnings("unchecked")
            java.util.TreeMap<Integer, Map<String,Object>> bimestres =
                    (java.util.TreeMap<Integer, Map<String,Object>>) mat.get("bimestres");

            BigDecimal somaMedias = BigDecimal.ZERO;
            int countBim = 0;

            for (Map.Entry<Integer, Map<String,Object>> entry : bimestres.entrySet()) {
                @SuppressWarnings("unchecked")
                List<Map<String,Object>> notas = (List<Map<String,Object>>) entry.getValue().get("notas");

                BigDecimal somaPonderada = BigDecimal.ZERO;
                BigDecimal somaPesos = BigDecimal.ZERO;
                BigDecimal bonus = BigDecimal.ZERO;
                BigDecimal recuperacaoNota = null;

                for (Map<String,Object> n : notas) {
                    String tipo = (String) n.get("tipo");
                    boolean isBon = (boolean) n.get("bonificacao");
                    BigDecimal val = (BigDecimal) n.get("valor");
                    BigDecimal peso = (BigDecimal) n.get("peso");

                    if ("RECUPERACAO".equals(tipo)) {
                        recuperacaoNota = val;
                    } else if (isBon) {
                        bonus = bonus.add(val);
                    } else {
                        somaPonderada = somaPonderada.add(val.multiply(peso));
                        somaPesos = somaPesos.add(peso);
                    }
                }

                BigDecimal media = somaPesos.compareTo(BigDecimal.ZERO) > 0
                        ? somaPonderada.divide(somaPesos, 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;

                // Recuperação: mantém a maior entre média do bimestre e nota de recuperação
                if (recuperacaoNota != null) {
                    media = media.max(recuperacaoNota);
                }

                BigDecimal mediaComBonus = media.add(bonus)
                        .min(BigDecimal.TEN)
                        .setScale(1, RoundingMode.HALF_UP);

                entry.getValue().put("media", mediaComBonus);
                if (somaPesos.compareTo(BigDecimal.ZERO) > 0 || recuperacaoNota != null) {
                    somaMedias = somaMedias.add(mediaComBonus);
                    countBim++;
                }
            }

            BigDecimal mediaAnual = countBim > 0
                    ? somaMedias.divide(new BigDecimal(countBim), 1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            mat.put("mediaAnual", mediaAnual);
            mat.put("totalFaltas", mat.getOrDefault("totalFaltas", 0));

            long totalAulas = todasPresencas.stream()
                    .filter(p -> p.getMateria().getId().equals(mat.get("materiaId")))
                    .count();
            long faltasMateria = todasPresencas.stream()
                    .filter(p -> p.getMateria().getId().equals(mat.get("materiaId")) && !Boolean.TRUE.equals(p.getPresente()))
                    .count();
            double freqMateria = totalAulas > 0
                    ? Math.round((totalAulas - faltasMateria) * 1000.0 / totalAulas) / 10.0
                    : 100.0;
            mat.put("totalAulas", totalAulas);
            mat.put("faltasMateria", faltasMateria);
            mat.put("frequenciaMateria", freqMateria);
        }

        long totalAulasGeral = todasPresencas.size();
        long faltasGeral = todasPresencas.stream().filter(p -> !Boolean.TRUE.equals(p.getPresente())).count();
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
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
    @Transactional
    public ResponseEntity<?> deletarAvaliacao(@PathVariable Long id, Authentication auth) {
        if (!avaliacaoRepository.existsById(id))
            return ResponseEntity.notFound().build();

        recuperacaoParticipanteRepository.deleteByAvaliacaoId(id);
        notaRepository.deleteAll(notaRepository.findByAvaliacaoId(id));
        avaliacaoRepository.deleteById(id);
        auditService.log(auth, "EXCLUIR", "AVALIACAO", String.valueOf(id), "Avaliação e notas removidas");

        return ResponseEntity.ok(Map.of("mensagem", "Avaliação e notas removidas com sucesso"));
    }

    /**
     * Resumo gerencial de uma turma: todos os alunos com média, frequência e situação.
     * Usado pelo Professor e Direção para identificar alunos em risco.
     */
    @GetMapping("/turma/{turmaId}/resumo")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> resumoTurma(@PathVariable Long turmaId) {
        var turmaOpt = turmaRepository.findById(turmaId);
        if (turmaOpt.isEmpty()) return ResponseEntity.badRequest().body("Turma não encontrada");
        var turma = turmaOpt.get();

        List<Map<String, Object>> result = new ArrayList<>();

        for (com.dom.schoolcrm.entity.AlunoTurma vinculo : alunoTurmaRepository.findByTurmaId(turmaId)) {
            Usuario aluno = vinculo.getAluno();
            Long alunoId  = aluno.getId();

            List<Nota> notas = notaRepository.findByAlunoId(alunoId).stream()
                    .filter(n -> n.getAvaliacao().getTurma().getId().equals(turmaId))
                    .toList();
            List<Presenca> presencas = presencaRepository.findByAlunoIdAndTurmaId(alunoId, turmaId);

            // Agrupa notas por matéria → bimestre e calcula médias
            Map<Long, List<Nota>> porMateria = new LinkedHashMap<>();
            notas.forEach(n -> porMateria
                    .computeIfAbsent(n.getAvaliacao().getMateria().getId(), k -> new ArrayList<>())
                    .add(n));

            List<Map<String, Object>> disciplinas = new ArrayList<>();
            List<BigDecimal> mediasArr = new ArrayList<>();

            for (Map.Entry<Long, List<Nota>> mEntry : porMateria.entrySet()) {
                Long matId = mEntry.getKey();
                Map<Integer, List<Nota>> porBim = new LinkedHashMap<>();
                mEntry.getValue().forEach(n -> {
                    int bim = n.getAvaliacao().getBimestre() != null ? n.getAvaliacao().getBimestre() : 1;
                    porBim.computeIfAbsent(bim, k -> new ArrayList<>()).add(n);
                });

                BigDecimal somaMediasBim = BigDecimal.ZERO;
                int cntBim = 0;
                for (List<Nota> bimNotas : porBim.values()) {
                    BigDecimal soma = BigDecimal.ZERO, pesos = BigDecimal.ZERO, bonus = BigDecimal.ZERO;
                    BigDecimal rec = null;
                    for (Nota n : bimNotas) {
                        String tipo = n.getAvaliacao().getTipo();
                        boolean isBon = Boolean.TRUE.equals(n.getAvaliacao().getBonificacao());
                        BigDecimal val = n.getValor(), peso = n.getAvaliacao().getPeso();
                        if ("RECUPERACAO".equals(tipo)) rec = val;
                        else if (isBon) bonus = bonus.add(val);
                        else { soma = soma.add(val.multiply(peso)); pesos = pesos.add(peso); }
                    }
                    if (pesos.compareTo(BigDecimal.ZERO) > 0 || rec != null) {
                        BigDecimal media = pesos.compareTo(BigDecimal.ZERO) > 0
                                ? soma.divide(pesos, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
                        if (rec != null) media = media.max(rec);
                        BigDecimal mComBonus = media.add(bonus).min(BigDecimal.TEN).setScale(1, RoundingMode.HALF_UP);
                        somaMediasBim = somaMediasBim.add(mComBonus);
                        cntBim++;
                    }
                }
                if (cntBim > 0) {
                    BigDecimal mediaAnual = somaMediasBim.divide(new BigDecimal(cntBim), 1, RoundingMode.HALF_UP);
                    mediasArr.add(mediaAnual);
                    String matNome = mEntry.getValue().get(0).getAvaliacao().getMateria().getNome();
                    long totalAulas = presencas.stream().filter(p -> p.getMateria().getId().equals(matId)).count();
                    long faltas = presencas.stream().filter(p -> p.getMateria().getId().equals(matId) && !Boolean.TRUE.equals(p.getPresente())).count();
                    double freq = totalAulas > 0 ? Math.round((totalAulas - faltas) * 1000.0 / totalAulas) / 10.0 : 100.0;
                    disciplinas.add(Map.of("materiaNome", matNome, "mediaAnual", mediaAnual, "frequencia", freq,
                            "emRisco", mediaAnual.compareTo(BigDecimal.valueOf(getMediaMinima())) < 0 || freq < getFreqMinima()));
                }
            }

            BigDecimal mediaGeral = mediasArr.isEmpty() ? null
                    : mediasArr.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                               .divide(new BigDecimal(mediasArr.size()), 1, RoundingMode.HALF_UP);
            long totalAulas = presencas.size();
            long faltasG = presencas.stream().filter(p -> !Boolean.TRUE.equals(p.getPresente())).count();
            double freqGeral = totalAulas > 0 ? Math.round((totalAulas - faltasG) * 1000.0 / totalAulas) / 10.0 : 100.0;

            boolean emRisco = (mediaGeral != null && mediaGeral.compareTo(BigDecimal.valueOf(getMediaMinima())) < 0) || freqGeral < getFreqMinima();
            String situacao = mediaGeral == null ? "Cursando" : emRisco ? "Em Risco" : "Aprovando";

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("alunoId",   alunoId);
            row.put("alunoNome", aluno.getNome());
            row.put("mediaGeral", mediaGeral);
            row.put("frequenciaGeral", freqGeral);
            row.put("disciplinas", disciplinas);
            row.put("situacao", situacao);
            row.put("emRisco", emRisco);
            result.add(row);
        }

        result.sort((a, b) -> {
            boolean ar = (boolean) a.get("emRisco"), br = (boolean) b.get("emRisco");
            if (ar != br) return ar ? -1 : 1;
            return ((String) a.get("alunoNome")).compareTo((String) b.get("alunoNome"));
        });

        List<BigDecimal> todasMedias = result.stream()
                .filter(r -> r.get("mediaGeral") != null)
                .map(r -> (BigDecimal) r.get("mediaGeral")).toList();
        BigDecimal mediaTurma = todasMedias.isEmpty() ? null
                : todasMedias.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                             .divide(new BigDecimal(todasMedias.size()), 1, RoundingMode.HALF_UP);
        long emRiscoCount = result.stream().filter(r -> (boolean) r.get("emRisco")).count();

        return ResponseEntity.ok(Map.of(
                "turmaId", turmaId,
                "turmaNome", turma.getNome(),
                "serie", turma.getSerie() != null ? turma.getSerie().getNome() : "",
                "totalAlunos", result.size(),
                "mediaTurma", mediaTurma != null ? mediaTurma : BigDecimal.ZERO,
                "emRiscoCount", emRiscoCount,
                "alunos", result));
    }

    @GetMapping("/calendario")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO', 'ALUNO')")
    public ResponseEntity<?> calendario(
            @RequestParam(required = false) Long turmaId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate dataFrom = from != null ? LocalDate.parse(from) : LocalDate.now();
        LocalDate dataTo   = to   != null ? LocalDate.parse(to)   : dataFrom.plusDays(30);
        List<Avaliacao> avs = avaliacaoRepository.findByDataAplicacaoBetween(dataFrom, dataTo);
        if (turmaId != null) avs = avaliacaoRepository.findByTurmaIdAndDataAplicacaoBetween(turmaId, dataFrom, dataTo);
        return ResponseEntity.ok(avs.stream().map(av -> {
            var m = new java.util.LinkedHashMap<String,Object>();
            m.put("id", av.getId());
            m.put("tipo", av.getTipo());
            m.put("descricao", av.getDescricao());
            m.put("dataAplicacao", av.getDataAplicacao());
            m.put("bimestre", av.getBimestre());
            m.put("turmaId",   av.getTurma()  != null ? av.getTurma().getId()   : null);
            m.put("turmaNome", av.getTurma()  != null ? av.getTurma().getNome() : "");
            m.put("materiaId",   av.getMateria() != null ? av.getMateria().getId()   : null);
            m.put("materiaNome", av.getMateria() != null ? av.getMateria().getNome() : "");
            return m;
        }).toList());
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
