package com.dom.schoolcrm.service;

import com.dom.schoolcrm.dto.relatorio.BoletimJasperDTO;
import com.dom.schoolcrm.dto.relatorio.TurmaJasperRowDTO;
import com.dom.schoolcrm.dto.relatorio.TurmaSituacaoRowDTO;
import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RelatorioService {

    @Autowired private NotaRepository notaRepository;
    @Autowired private PresencaRepository presencaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private TurmaRepository turmaRepository;
    @Autowired private AlunoTurmaRepository alunoTurmaRepository;

    // ─── Boletim individual ───────────────────────────────────────────────

    public byte[] gerarBoletimPDF(Long alunoId, Long turmaId) throws Exception {
        Usuario aluno = usuarioRepository.findById(alunoId)
                .orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado"));
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new IllegalArgumentException("Turma não encontrada"));

        List<Nota> todasNotas = notaRepository.findByAlunoId(alunoId).stream()
                .filter(n -> n.getAvaliacao().getTurma().getId().equals(turmaId))
                .toList();

        List<Presenca> todasPresencas = presencaRepository.findByAlunoIdAndTurmaId(alunoId, turmaId);

        Map<Long, DisciplinaCalc> calcMap = calcularPorMateria(todasNotas, todasPresencas);

        List<BoletimJasperDTO> rows = new ArrayList<>();
        boolean tudoAprovado = true;
        boolean algumCursando = false;

        for (DisciplinaCalc dc : calcMap.values()) {
            BoletimJasperDTO dto = new BoletimJasperDTO();
            dto.setMateriaNome(dc.materiaNome);

            for (int b = 1; b <= 4; b++) {
                BigDecimal media = dc.medias.get(b);
                int faltas = dc.faltas.getOrDefault(b, 0);
                String mediaStr = media != null ? media.toPlainString() : "—";
                switch (b) {
                    case 1 -> { dto.setMedia1(mediaStr); dto.setFaltas1(faltas); }
                    case 2 -> { dto.setMedia2(mediaStr); dto.setFaltas2(faltas); }
                    case 3 -> { dto.setMedia3(mediaStr); dto.setFaltas3(faltas); }
                    case 4 -> { dto.setMedia4(mediaStr); dto.setFaltas4(faltas); }
                }
            }

            double mediaAnualD = dc.mediaAnual != null ? dc.mediaAnual.doubleValue() : -1;
            dto.setMediaAnual(dc.mediaAnual != null ? dc.mediaAnual.toPlainString() : "—");
            dto.setMediaAnualDouble(dc.mediaAnual != null ? mediaAnualD : null);
            dto.setTotalFaltas((int) dc.totalFaltas);
            dto.setFrequencia(String.format("%.1f%%", dc.frequencia));
            dto.setFrequenciaDouble(dc.frequencia);

            if (dc.mediaAnual == null) {
                algumCursando = true;
                dto.setSituacao("Em curso");
            } else if (mediaAnualD < 6.0 || dc.frequencia < 75.0) {
                tudoAprovado = false;
                dto.setSituacao("Reprovado");
            } else {
                dto.setSituacao("Aprovado");
            }

            rows.add(dto);
        }

        long totalAulasGeral = todasPresencas.size();
        long faltasGeral = todasPresencas.stream().filter(p -> !Boolean.TRUE.equals(p.getPresente())).count();
        double freqGeral = totalAulasGeral > 0
                ? Math.round((totalAulasGeral - faltasGeral) * 1000.0 / totalAulasGeral) / 10.0
                : 100.0;

        String resultadoFinal = algumCursando ? "Em curso"
                : tudoAprovado && freqGeral >= 75.0 ? "Aprovado" : "Reprovado";

        Map<String, Object> params = new HashMap<>();
        params.put("ALUNO_NOME", aluno.getNome());
        params.put("ALUNO_ID", aluno.getId());
        params.put("TURMA_NOME", turma.getNome());
        params.put("SERIE_NOME", turma.getSerie() != null ? turma.getSerie().getNome() : "");
        params.put("ANO_LETIVO", turma.getAnoLetivo());
        params.put("FREQ_GERAL", String.format("%.1f%%", freqGeral));
        params.put("RESULTADO_FINAL", resultadoFinal);
        params.put("DATA_EMISSAO", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        return compilarEExportar("/reports/boletim.jrxml", params, new JRBeanCollectionDataSource(rows));
    }

    // ─── Boletim em lote (ZIP) ────────────────────────────────────────────

    public byte[] gerarBoletinsLoteZip(Long turmaId) throws Exception {
        turmaRepository.findById(turmaId)
                .orElseThrow(() -> new IllegalArgumentException("Turma não encontrada"));

        List<AlunoTurma> vinculos = alunoTurmaRepository.findByTurmaId(turmaId);
        if (vinculos.isEmpty())
            throw new IllegalArgumentException("Nenhum aluno encontrado na turma");

        vinculos.sort(Comparator.comparing(at -> at.getAluno().getNome()));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(baos)) {
            for (AlunoTurma at : vinculos) {
                Long alunoId = at.getAluno().getId();
                String nomeArquivo = "boletim_" + sanitizarNome(at.getAluno().getNome()) + ".pdf";
                byte[] pdf = gerarBoletimPDF(alunoId, turmaId);
                zip.putNextEntry(new ZipEntry(nomeArquivo));
                zip.write(pdf);
                zip.closeEntry();
            }
        }
        return baos.toByteArray();
    }

    private String sanitizarNome(String nome) {
        return nome.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    }

    // ─── Relatório de turma ───────────────────────────────────────────────

    public byte[] gerarRelatorioTurmaPDF(Long turmaId, String tipo, Integer bimestre) throws Exception {
        Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new IllegalArgumentException("Turma não encontrada"));

        List<AlunoTurma> vinculos = alunoTurmaRepository.findByTurmaId(turmaId);

        List<BoletimDado> boletins = new ArrayList<>();
        for (AlunoTurma v : vinculos) {
            Long alunoId = v.getAluno().getId();
            List<Nota> notas = notaRepository.findByAlunoId(alunoId).stream()
                    .filter(n -> n.getAvaliacao().getTurma().getId().equals(turmaId))
                    .toList();
            List<Presenca> presencas = presencaRepository.findByAlunoIdAndTurmaId(alunoId, turmaId);
            Map<Long, DisciplinaCalc> calcMap = calcularPorMateria(notas, presencas);

            long totalAulas = presencas.size();
            long faltasGeral = presencas.stream().filter(p -> !Boolean.TRUE.equals(p.getPresente())).count();
            double freqGeral = totalAulas > 0
                    ? Math.round((totalAulas - faltasGeral) * 1000.0 / totalAulas) / 10.0
                    : 100.0;

            boletins.add(new BoletimDado(v.getAluno().getNome(), calcMap, freqGeral));
        }
        boletins.sort(Comparator.comparing(b -> b.alunoNome));

        Map<String, Object> params = new HashMap<>();
        params.put("TURMA_NOME", turma.getNome());
        params.put("SERIE_NOME", turma.getSerie() != null ? turma.getSerie().getNome() : "");
        params.put("ANO_LETIVO", turma.getAnoLetivo());
        params.put("DATA_EMISSAO", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        String bimestreLabel = bimestre == 0 ? "Ano completo" : bimestre + "º Bimestre";
        params.put("PERIODO", bimestreLabel);

        if ("situacao".equals(tipo)) {
            List<TurmaSituacaoRowDTO> rows = buildSituacaoRows(boletins);
            params.put("TOTAL_APROVADOS", (int) rows.stream().filter(r -> "Aprovado".equals(r.getSituacao())).count());
            params.put("TOTAL_REPROVADOS", (int) rows.stream().filter(r -> "Reprovado".equals(r.getSituacao())).count());
            params.put("TOTAL_CURSANDO", (int) rows.stream().filter(r -> "Em curso".equals(r.getSituacao())).count());
            return compilarEExportar("/reports/relatorio_turma_situacao.jrxml", params,
                    new JRBeanCollectionDataSource(rows));
        } else {
            List<TurmaJasperRowDTO> rows = buildCrosstabRows(boletins, tipo, bimestre);
            params.put("CROSSTAB_DATA", new JRBeanCollectionDataSource(rows));
            String jrxml = "medias".equals(tipo)
                    ? "/reports/relatorio_turma_medias.jrxml"
                    : "/reports/relatorio_turma_frequencia.jrxml";
            return compilarEExportar(jrxml, params, new JREmptyDataSource());
        }
    }

    // ─── Helpers de cálculo ───────────────────────────────────────────────

    private Map<Long, DisciplinaCalc> calcularPorMateria(List<Nota> notas, List<Presenca> presencas) {
        Map<Long, DisciplinaCalc> calcMap = new LinkedHashMap<>();

        for (Nota nota : notas) {
            Long matId = nota.getAvaliacao().getMateria().getId();
            String matNome = nota.getAvaliacao().getMateria().getNome();
            calcMap.computeIfAbsent(matId, k -> new DisciplinaCalc(matId, matNome));
            DisciplinaCalc dc = calcMap.get(matId);

            Integer bim = nota.getAvaliacao().getBimestre() != null ? nota.getAvaliacao().getBimestre() : 1;
            dc.notasPorBimestre.computeIfAbsent(bim, k -> new ArrayList<>()).add(nota);
        }

        for (DisciplinaCalc dc : calcMap.values()) {
            BigDecimal somaMedias = BigDecimal.ZERO;
            int countBim = 0;

            for (Map.Entry<Integer, List<Nota>> entry : dc.notasPorBimestre.entrySet()) {
                int bim = entry.getKey();
                List<Nota> notasBim = entry.getValue();

                BigDecimal somaPonderada = BigDecimal.ZERO;
                BigDecimal somaPesos = BigDecimal.ZERO;
                BigDecimal bonus = BigDecimal.ZERO;
                BigDecimal recuperacaoNota = null;

                for (Nota n : notasBim) {
                    String tipo = n.getAvaliacao().getTipo();
                    boolean isBon = Boolean.TRUE.equals(n.getAvaliacao().getBonificacao());
                    BigDecimal val = n.getValor();
                    BigDecimal peso = n.getAvaliacao().getPeso();

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

                if (recuperacaoNota != null) {
                    media = media.max(recuperacaoNota);
                }

                BigDecimal mediaComBonus = media.add(bonus)
                        .min(BigDecimal.TEN)
                        .setScale(1, RoundingMode.HALF_UP);

                dc.medias.put(bim, mediaComBonus);

                long faltasBim = presencas.stream()
                        .filter(p -> p.getMateria().getId().equals(dc.materiaId)
                                && p.getPresente() != null && !p.getPresente())
                        .count();
                dc.faltas.put(bim, (int) faltasBim);

                if (somaPesos.compareTo(BigDecimal.ZERO) > 0 || recuperacaoNota != null) {
                    somaMedias = somaMedias.add(mediaComBonus);
                    countBim++;
                }
            }

            dc.mediaAnual = countBim > 0
                    ? somaMedias.divide(new BigDecimal(countBim), 1, RoundingMode.HALF_UP)
                    : null;

            long totalAulas = presencas.stream().filter(p -> p.getMateria().getId().equals(dc.materiaId)).count();
            long faltasMateria = presencas.stream()
                    .filter(p -> p.getMateria().getId().equals(dc.materiaId)
                            && p.getPresente() != null && !p.getPresente())
                    .count();
            dc.totalFaltas = faltasMateria;
            dc.frequencia = totalAulas > 0
                    ? Math.round((totalAulas - faltasMateria) * 1000.0 / totalAulas) / 10.0
                    : 100.0;
        }

        return calcMap;
    }

    private List<TurmaJasperRowDTO> buildCrosstabRows(List<BoletimDado> boletins, String tipo, Integer bimestre) {
        List<TurmaJasperRowDTO> rows = new ArrayList<>();
        for (BoletimDado b : boletins) {
            for (DisciplinaCalc dc : b.calcMap.values()) {
                Double valor;
                if ("medias".equals(tipo)) {
                    if (bimestre == 0) {
                        valor = dc.mediaAnual != null ? dc.mediaAnual.doubleValue() : null;
                    } else {
                        BigDecimal m = dc.medias.get(bimestre);
                        valor = m != null ? m.doubleValue() : null;
                    }
                } else {
                    valor = dc.frequencia;
                }
                if (valor != null) {
                    rows.add(new TurmaJasperRowDTO(b.alunoNome, dc.materiaNome, valor));
                }
            }
        }
        return rows;
    }

    private List<TurmaSituacaoRowDTO> buildSituacaoRows(List<BoletimDado> boletins) {
        List<TurmaSituacaoRowDTO> rows = new ArrayList<>();
        for (BoletimDado b : boletins) {
            TurmaSituacaoRowDTO dto = new TurmaSituacaoRowDTO();
            dto.setAlunoNome(b.alunoNome);
            dto.setFrequenciaGeral(String.format("%.1f%%", b.freqGeral));
            dto.setFrequenciaGeralDouble(b.freqGeral);

            boolean algumCursando = b.calcMap.values().stream().anyMatch(dc -> dc.mediaAnual == null);
            boolean algumReprovadoNota = b.calcMap.values().stream()
                    .filter(dc -> dc.mediaAnual != null)
                    .anyMatch(dc -> dc.mediaAnual.doubleValue() < 6.0);
            boolean freqInsuficiente = b.freqGeral < 75.0;

            if (algumCursando) {
                dto.setSituacao("Em curso");
            } else if (algumReprovadoNota || freqInsuficiente) {
                dto.setSituacao("Reprovado");
            } else {
                dto.setSituacao("Aprovado");
            }

            List<String> problemas = new ArrayList<>();
            b.calcMap.values().stream()
                    .filter(dc -> dc.mediaAnual != null && dc.mediaAnual.doubleValue() < 6.0)
                    .forEach(dc -> problemas.add(dc.materiaNome + " (nota)"));
            if (freqInsuficiente) problemas.add("Freq. insuficiente");
            b.calcMap.values().stream()
                    .filter(dc -> dc.mediaAnual != null
                            && dc.mediaAnual.doubleValue() >= 6.0
                            && dc.mediaAnual.doubleValue() < 7.0
                            && !"Em curso".equals(dto.getSituacao()))
                    .forEach(dc -> problemas.add(dc.materiaNome + " (risco)"));

            dto.setMateriaRisco(problemas.isEmpty() ? "—" : String.join(", ", problemas));
            rows.add(dto);
        }
        return rows;
    }

    // ─── Compilação e exportação ──────────────────────────────────────────
    // jasperreports.properties configura JRJdtCompiler (Eclipse JDT) que usa
    // Thread.currentThread().getContextClassLoader() — funciona no fat JAR
    // do Spring Boot onde o javac não alcança classes em nested JARs.

    private byte[] compilarEExportar(String jrxmlPath, Map<String, Object> params, JRDataSource dataSource)
            throws JRException {
        InputStream is = getClass().getResourceAsStream(jrxmlPath);
        if (is == null) throw new IllegalStateException("Template não encontrado: " + jrxmlPath);
        JasperReport report = JasperCompileManager.compileReport(is);
        JasperPrint print = JasperFillManager.fillReport(report, params, dataSource);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        JasperExportManager.exportReportToPdfStream(print, baos);
        return baos.toByteArray();
    }

    // ─── Classes internas de suporte ─────────────────────────────────────

    private static class DisciplinaCalc {
        Long materiaId;
        String materiaNome;
        Map<Integer, List<Nota>> notasPorBimestre = new TreeMap<>();
        Map<Integer, BigDecimal> medias = new TreeMap<>();
        Map<Integer, Integer> faltas = new TreeMap<>();
        BigDecimal mediaAnual;
        long totalFaltas;
        double frequencia = 100.0;

        DisciplinaCalc(Long materiaId, String materiaNome) {
            this.materiaId = materiaId;
            this.materiaNome = materiaNome;
        }
    }

    private static class BoletimDado {
        String alunoNome;
        Map<Long, DisciplinaCalc> calcMap;
        double freqGeral;

        BoletimDado(String alunoNome, Map<Long, DisciplinaCalc> calcMap, double freqGeral) {
            this.alunoNome = alunoNome;
            this.calcMap = calcMap;
            this.freqGeral = freqGeral;
        }
    }
}
