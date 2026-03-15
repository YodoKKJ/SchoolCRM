package com.dom.schoolcrm.service;

import com.dom.schoolcrm.dto.relatorio.fin.*;
import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import com.dom.schoolcrm.util.FinUtil;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FinRelatorioService {

    private static final DateTimeFormatter FMT_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FMT_MES  = DateTimeFormatter.ofPattern("MM/yyyy");

    @Autowired private FinContaReceberRepository crRepo;
    @Autowired private FinContaPagarRepository   cpRepo;
    @Autowired private FinMovimentacaoRepository movRepo;
    @Autowired private FinFuncionarioRepository  funcRepo;
    @Autowired private FinBeneficioRepository    benefRepo;
    @Autowired private FinResponsavelAlunoRepository respRepo;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. CONTAS A RECEBER POR PERÍODO
    // ─────────────────────────────────────────────────────────────────────────
    public byte[] gerarContasReceberPDF(LocalDate de, LocalDate ate, String status, String tipo) throws JRException {
        List<FinContaReceber> lista = crRepo.buscar(null, tipo, status, de, ate);
        LocalDate hoje = LocalDate.now();

        List<FinCRRelatorioItemDTO> rows = new ArrayList<>();
        BigDecimal totalValor = BigDecimal.ZERO;
        BigDecimal totalRecebido = BigDecimal.ZERO;
        BigDecimal totalSaldo = BigDecimal.ZERO;

        for (FinContaReceber cr : lista) {
            String statusEfetivo = FinUtil.statusEfetivo(cr, hoje);
            String nome = resolverNomeCR(cr);
            String parcela = (cr.getNumParcela() != null)
                    ? cr.getNumParcela() + "/" + cr.getTotalParcelas() : "-";
            BigDecimal pago   = nvl(cr.getValorPago());
            BigDecimal saldo  = cr.getValor().add(nvl(cr.getJurosAplicado())).add(nvl(cr.getMultaAplicada())).subtract(pago);
            if (saldo.compareTo(BigDecimal.ZERO) < 0) saldo = BigDecimal.ZERO;

            totalValor     = totalValor.add(cr.getValor());
            totalRecebido  = totalRecebido.add(pago);
            totalSaldo     = totalSaldo.add(saldo);

            rows.add(new FinCRRelatorioItemDTO(
                    nome,
                    cr.getDescricao(),
                    formatarTipoCR(cr.getTipo()),
                    parcela,
                    fmt(cr.getDataVencimento()),
                    fmt(cr.getDataPagamento()),
                    brl(cr.getValor()),
                    pago.compareTo(BigDecimal.ZERO) > 0 ? brl(pago) : "-",
                    brl(saldo),
                    statusEfetivo,
                    cr.getFormaPagamento() != null ? cr.getFormaPagamento().getNome() : "-"
            ));
        }

        Map<String, Object> params = new HashMap<>();
        params.put("PERIODO", fmt(de) + " a " + fmt(ate));
        params.put("DATA_EMISSAO", fmt(LocalDate.now()));
        params.put("TOTAL_REGISTROS", rows.size());
        params.put("TOTAL_VALOR",    brl(totalValor));
        params.put("TOTAL_RECEBIDO", brl(totalRecebido));
        params.put("TOTAL_SALDO",    brl(totalSaldo));

        return compilarEGerar("relatorio_fin_contas_receber", rows, params);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. CONTAS A PAGAR POR PERÍODO
    // ─────────────────────────────────────────────────────────────────────────
    public byte[] gerarContasPagarPDF(LocalDate de, LocalDate ate, String status, String tipo, String categoria) throws JRException {
        List<FinContaPagar> lista = cpRepo.buscar(tipo, categoria, status, de, ate, null);
        LocalDate hoje = LocalDate.now();

        List<FinCPRelatorioItemDTO> rows = new ArrayList<>();
        BigDecimal totalValor  = BigDecimal.ZERO;
        BigDecimal totalPago   = BigDecimal.ZERO;
        BigDecimal totalSaldo  = BigDecimal.ZERO;

        for (FinContaPagar cp : lista) {
            String statusEfetivo = FinUtil.statusEfetivo(cp, hoje);
            String beneficiario  = resolverBeneficiarioCP(cp);
            BigDecimal pago  = nvl(cp.getValorPago());
            BigDecimal saldo = cp.getValor().add(nvl(cp.getJurosAplicado())).add(nvl(cp.getMultaAplicada())).subtract(pago);
            if (saldo.compareTo(BigDecimal.ZERO) < 0) saldo = BigDecimal.ZERO;

            totalValor  = totalValor.add(cp.getValor());
            totalPago   = totalPago.add(pago);
            totalSaldo  = totalSaldo.add(saldo);

            rows.add(new FinCPRelatorioItemDTO(
                    cp.getDescricao(),
                    formatarTipoCP(cp.getTipo()),
                    cp.getCategoria() != null ? cp.getCategoria() : "-",
                    beneficiario,
                    fmt(cp.getDataVencimento()),
                    fmt(cp.getDataPagamento()),
                    brl(cp.getValor()),
                    pago.compareTo(BigDecimal.ZERO) > 0 ? brl(pago) : "-",
                    brl(saldo),
                    statusEfetivo,
                    cp.getFormaPagamento() != null ? cp.getFormaPagamento().getNome() : "-"
            ));
        }

        Map<String, Object> params = new HashMap<>();
        params.put("PERIODO", fmt(de) + " a " + fmt(ate));
        params.put("DATA_EMISSAO", fmt(LocalDate.now()));
        params.put("TOTAL_REGISTROS", rows.size());
        params.put("TOTAL_VALOR",  brl(totalValor));
        params.put("TOTAL_PAGO",   brl(totalPago));
        params.put("TOTAL_SALDO",  brl(totalSaldo));

        return compilarEGerar("relatorio_fin_contas_pagar", rows, params);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. INADIMPLÊNCIA
    // ─────────────────────────────────────────────────────────────────────────
    public byte[] gerarInadimplenciaPDF(LocalDate dataBase) throws JRException {
        List<FinContaReceber> vencidas = crRepo.findVencidas(dataBase);

        List<FinInadimplenciaItemDTO> rows = new ArrayList<>();
        BigDecimal totalSaldo = BigDecimal.ZERO;

        // Agrupar por aluno para buscar responsável uma vez por aluno
        Map<Long, String[]> cacheResp = new HashMap<>(); // alunoId -> [nome, telefone]

        for (FinContaReceber cr : vencidas) {
            String alunoNome;
            String respNome = "-";
            String respTel  = "-";

            if (cr.getContrato() != null && cr.getContrato().getAluno() != null) {
                Usuario aluno = cr.getContrato().getAluno();
                alunoNome = aluno.getNome();
                Long alunoId = aluno.getId();
                if (!cacheResp.containsKey(alunoId)) {
                    List<FinResponsavelAluno> resps = respRepo.findByAlunoId(alunoId);
                    FinResponsavelAluno principal = resps.stream()
                            .filter(r -> "PRINCIPAL".equals(r.getTipo()))
                            .findFirst().orElse(resps.isEmpty() ? null : resps.get(0));
                    if (principal != null && principal.getPessoa() != null) {
                        FinPessoa p = principal.getPessoa();
                        cacheResp.put(alunoId, new String[]{p.getNome(), nvlStr(p.getTelefone())});
                    } else {
                        cacheResp.put(alunoId, new String[]{"-", "-"});
                    }
                }
                respNome = cacheResp.get(alunoId)[0];
                respTel  = cacheResp.get(alunoId)[1];
            } else {
                alunoNome = cr.getPessoa() != null ? cr.getPessoa().getNome() : "-";
            }

            BigDecimal pago  = nvl(cr.getValorPago());
            BigDecimal saldo = cr.getValor()
                    .add(nvl(cr.getJurosAplicado()))
                    .add(nvl(cr.getMultaAplicada()))
                    .subtract(pago);
            if (saldo.compareTo(BigDecimal.ZERO) < 0) saldo = BigDecimal.ZERO;

            long dias = ChronoUnit.DAYS.between(cr.getDataVencimento(), dataBase);
            String parcela = (cr.getNumParcela() != null)
                    ? cr.getNumParcela() + "/" + cr.getTotalParcelas() : "-";

            BigDecimal jm = nvl(cr.getJurosAplicado()).add(nvl(cr.getMultaAplicada()));

            totalSaldo = totalSaldo.add(saldo);

            rows.add(new FinInadimplenciaItemDTO(
                    alunoNome, respNome, respTel,
                    cr.getDescricao(), parcela,
                    fmt(cr.getDataVencimento()),
                    (int) dias,
                    brl(cr.getValor()),
                    jm.compareTo(BigDecimal.ZERO) > 0 ? brl(jm) : "-",
                    brl(saldo)
            ));
        }

        // ordenar por aluno
        rows.sort(Comparator.comparing(FinInadimplenciaItemDTO::getAlunoNome)
                .thenComparing(FinInadimplenciaItemDTO::getVencimento));

        long qtdAlunos = rows.stream().map(FinInadimplenciaItemDTO::getAlunoNome).distinct().count();

        Map<String, Object> params = new HashMap<>();
        params.put("DATA_BASE",      fmt(dataBase));
        params.put("DATA_EMISSAO",   fmt(LocalDate.now()));
        params.put("TOTAL_REGISTROS", rows.size());
        params.put("QTD_ALUNOS",     (int) qtdAlunos);
        params.put("TOTAL_SALDO",    brl(totalSaldo));

        return compilarEGerar("relatorio_fin_inadimplencia", rows, params);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. FLUXO DE CAIXA
    // ─────────────────────────────────────────────────────────────────────────
    public byte[] gerarFluxoCaixaPDF(LocalDate de, LocalDate ate) throws JRException {
        List<FinFluxoCaixaItemDTO> rows = new ArrayList<>();
        BigDecimal totalEntradas = BigDecimal.ZERO;
        BigDecimal totalSaidas   = BigDecimal.ZERO;

        // CR recebidas no período
        List<FinContaReceber> crRecebidas = crRepo.buscar(null, null, "PAGO", de, ate);
        for (FinContaReceber cr : crRecebidas) {
            if (cr.getDataPagamento() == null) continue;
            BigDecimal val = nvl(cr.getValorPago());
            totalEntradas = totalEntradas.add(val);
            rows.add(new FinFluxoCaixaItemDTO(
                    fmt(cr.getDataPagamento()),
                    cr.getDescricao() + (cr.getNumParcela() != null ? " (" + cr.getNumParcela() + "/" + cr.getTotalParcelas() + ")" : ""),
                    "ENTRADA",
                    "CR",
                    formatarTipoCR(cr.getTipo()),
                    brl(val),
                    cr.getFormaPagamento() != null ? cr.getFormaPagamento().getNome() : "-"
            ));
        }

        // CP pagas no período
        List<FinContaPagar> cpPagas = cpRepo.buscar(null, null, "PAGO", de, ate, null);
        for (FinContaPagar cp : cpPagas) {
            if (cp.getDataPagamento() == null) continue;
            BigDecimal val = nvl(cp.getValorPago());
            totalSaidas = totalSaidas.add(val);
            rows.add(new FinFluxoCaixaItemDTO(
                    fmt(cp.getDataPagamento()),
                    cp.getDescricao(),
                    "SAÍDA",
                    "CP",
                    cp.getCategoria() != null ? cp.getCategoria() : "-",
                    brl(val),
                    cp.getFormaPagamento() != null ? cp.getFormaPagamento().getNome() : "-"
            ));
        }

        // Movimentações avulsas no período
        List<FinMovimentacao> movs = movRepo.buscar(null, null, de, ate);
        for (FinMovimentacao m : movs) {
            if ("ENTRADA".equals(m.getTipo())) totalEntradas = totalEntradas.add(m.getValor());
            else                               totalSaidas   = totalSaidas.add(m.getValor());
            rows.add(new FinFluxoCaixaItemDTO(
                    fmt(m.getDataMovimentacao()),
                    m.getDescricao(),
                    "ENTRADA".equals(m.getTipo()) ? "ENTRADA" : "SAÍDA",
                    "MOV",
                    nvlStr(m.getCategoria()),
                    brl(m.getValor()),
                    m.getFormaPagamento() != null ? m.getFormaPagamento().getNome() : "-"
            ));
        }

        // Ordenar por data
        rows.sort(Comparator.comparing(FinFluxoCaixaItemDTO::getData));

        BigDecimal saldo = totalEntradas.subtract(totalSaidas);

        Map<String, Object> params = new HashMap<>();
        params.put("PERIODO",         fmt(de) + " a " + fmt(ate));
        params.put("DATA_EMISSAO",    fmt(LocalDate.now()));
        params.put("TOTAL_REGISTROS", rows.size());
        params.put("TOTAL_ENTRADAS",  brl(totalEntradas));
        params.put("TOTAL_SAIDAS",    brl(totalSaidas));
        params.put("SALDO",           brl(saldo));

        return compilarEGerar("relatorio_fin_fluxo_caixa", rows, params);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. FOLHA DE PAGAMENTO
    // ─────────────────────────────────────────────────────────────────────────
    public byte[] gerarFolhaPagamentoPDF(String mes) throws JRException {
        List<FinFuncionario> funcionarios = funcRepo.findByAtivoTrueOrderByPessoaNomeAsc();

        List<FinFolhaItemDTO> rows = new ArrayList<>();
        BigDecimal totalFolha = BigDecimal.ZERO;

        for (FinFuncionario f : funcionarios) {
            List<FinBeneficio> beneficiosAtivos = benefRepo.findByFuncionarioIdAndAtivoTrue(f.getId());

            BigDecimal totalBeneficios = beneficiosAtivos.stream()
                    .map(FinBeneficio::getValor)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalBruto = f.getSalarioBase().add(totalBeneficios);
            totalFolha = totalFolha.add(totalBruto);

            String descBeneficios = beneficiosAtivos.isEmpty() ? "-" :
                    beneficiosAtivos.stream()
                            .map(b -> b.getDescricao() != null ? b.getDescricao() : b.getTipo())
                            .collect(Collectors.joining(", "));

            String carga = f.getCargaHoraria() != null
                    ? f.getCargaHoraria().setScale(0, RoundingMode.HALF_UP) + "h/sem" : "-";

            rows.add(new FinFolhaItemDTO(
                    f.getPessoa().getNome(),
                    f.getCargo(),
                    carga,
                    brl(f.getSalarioBase()),
                    descBeneficios,
                    brl(totalBruto),
                    totalBruto
            ));
        }

        // Formatar mês para exibição (2026-03 → "Março/2026")
        String mesExibicao = formatarMes(mes);

        Map<String, Object> params = new HashMap<>();
        params.put("MES_REFERENCIA",  mesExibicao);
        params.put("DATA_EMISSAO",    fmt(LocalDate.now()));
        params.put("TOTAL_FUNCIONARIOS", rows.size());
        params.put("TOTAL_FOLHA",     brl(totalFolha));

        return compilarEGerar("relatorio_fin_folha_pagamento", rows, params);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private byte[] compilarEGerar(String nomeTemplate, List<?> dados, Map<String, Object> params) throws JRException {
        String path = "/reports/" + nomeTemplate + ".jrxml";
        InputStream is = getClass().getResourceAsStream(path);
        if (is == null) throw new IllegalStateException("Template não encontrado: " + path);
        JasperReport compiled = JasperCompileManager.compileReport(is);
        JRBeanCollectionDataSource ds = new JRBeanCollectionDataSource(dados);
        JasperPrint print = JasperFillManager.fillReport(compiled, params, ds);
        return JasperExportManager.exportReportToPdf(print);
    }

    private String resolverNomeCR(FinContaReceber cr) {
        if (cr.getContrato() != null && cr.getContrato().getAluno() != null)
            return cr.getContrato().getAluno().getNome();
        if (cr.getPessoa() != null)
            return cr.getPessoa().getNome();
        return "-";
    }

    private String resolverBeneficiarioCP(FinContaPagar cp) {
        if (cp.getFuncionario() != null && cp.getFuncionario().getPessoa() != null)
            return cp.getFuncionario().getPessoa().getNome();
        if (cp.getPessoa() != null)
            return cp.getPessoa().getNome();
        return "-";
    }

    private String formatarTipoCR(String tipo) {
        if (tipo == null) return "-";
        return switch (tipo) {
            case "MENSALIDADE" -> "Mensalidade";
            case "MATRICULA"   -> "Matrícula";
            case "UNIFORME"    -> "Uniforme";
            case "EVENTO"      -> "Evento";
            default            -> tipo;
        };
    }

    private String formatarTipoCP(String tipo) {
        if (tipo == null) return "-";
        return switch (tipo) {
            case "SALARIO"     -> "Salário";
            case "CONTA_FIXA"  -> "Conta Fixa";
            case "FORNECEDOR"  -> "Fornecedor";
            default            -> tipo;
        };
    }

    private String formatarMes(String mes) {
        if (mes == null || mes.length() < 7) return mes;
        try {
            String[] parts = mes.split("-");
            int m = Integer.parseInt(parts[1]);
            String[] nomes = {"", "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"};
            return nomes[m] + "/" + parts[0];
        } catch (Exception e) {
            return mes;
        }
    }

    private static String fmt(LocalDate d) {
        return d != null ? d.format(FMT_DATA) : "-";
    }

    private static String brl(BigDecimal v) {
        if (v == null) return "R$ 0,00";
        return "R$ " + String.format("%,.2f", v).replace(".", "X").replace(",", ".").replace("X", ",");
    }

    private static BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static String nvlStr(String v) {
        return v != null && !v.isBlank() ? v : "-";
    }
}
