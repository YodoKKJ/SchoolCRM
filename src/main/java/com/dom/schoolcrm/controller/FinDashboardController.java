package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinContaPagar;
import com.dom.schoolcrm.entity.FinContaReceber;
import com.dom.schoolcrm.repository.*;
import com.dom.schoolcrm.security.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Dashboard financeiro — agrega dados de todos os módulos num único endpoint.
 *
 * GET /fin/dashboard?mes=2026-03
 *
 * Retorna:
 *   kpis              → totais do mês (recebido, pago, saldo, pendências, inadimplência)
 *   grafico           → receitas vs despesas dos últimos 6 meses (para gráfico de barras)
 *   proximosVencimentos → CR e CP com vencimento nos próximos 7 dias
 *   inadimplentes     → CR PENDENTE com vencimento antes de hoje
 */
@RestController
@RequestMapping("/fin/dashboard")
@PreAuthorize("hasRole('DIRECAO')")
public class FinDashboardController {

    @Autowired private FinContaReceberRepository crRepository;
    @Autowired private FinContaPagarRepository   cpRepository;
    @Autowired private FinMovimentacaoRepository movRepository;

    private static final Locale PT_BR = new Locale("pt", "BR");

    @GetMapping
    public ResponseEntity<Map<String, Object>> dashboard(
            @RequestParam(required = false) String mes) {

        // Mês de referência — padrão: mês atual
        YearMonth ym = (mes != null && !mes.isBlank()) ? YearMonth.parse(mes) : YearMonth.now();
        LocalDate inicio = ym.atDay(1);
        LocalDate fim    = ym.atEndOfMonth();
        LocalDate hoje   = LocalDate.now();
        Long escolaId    = TenantContext.getEscolaId();

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("mesReferencia", ym.toString());
        resposta.put("periodo", Map.of("de", inicio, "ate", fim));
        resposta.put("kpis",               calcularKpis(inicio, fim, hoje, escolaId));
        resposta.put("grafico",            calcularGrafico(ym, escolaId));
        resposta.put("proximosVencimentos", calcularProximosVencimentos(hoje, escolaId));
        resposta.put("inadimplentes",       calcularInadimplentes(hoje, escolaId));

        return ResponseEntity.ok(resposta);
    }

    // ─── KPIs do mês ──────────────────────────────────────────────────────────

    private Map<String, Object> calcularKpis(LocalDate inicio, LocalDate fim, LocalDate hoje, Long escolaId) {

        // Recebimentos: mensalidades/CR pagas no mês + entradas avulsas
        BigDecimal crRecebido       = escolaId != null ? crRepository.somarRecebidoNoPeriodoByEscola(inicio, fim, escolaId) : crRepository.somarRecebidoNoPeriodo(inicio, fim);
        BigDecimal entradasAvulsas  = escolaId != null ? movRepository.somarEntradasNoPeriodoByEscola(inicio, fim, escolaId) : movRepository.somarEntradasNoPeriodo(inicio, fim);
        BigDecimal totalEntradas    = crRecebido.add(entradasAvulsas);

        // Pagamentos: CP pagas no mês + saídas avulsas
        BigDecimal cpPago           = escolaId != null ? cpRepository.somarPagoNoPeriodoByEscola(inicio, fim, escolaId) : cpRepository.somarPagoNoPeriodo(inicio, fim);
        BigDecimal saidasAvulsas    = escolaId != null ? movRepository.somarSaidasNoPeriodoByEscola(inicio, fim, escolaId) : movRepository.somarSaidasNoPeriodo(inicio, fim);
        BigDecimal totalSaidas      = cpPago.add(saidasAvulsas);

        BigDecimal saldoMes = totalEntradas.subtract(totalSaidas);

        // Pendências (não vencidas)
        BigDecimal crAReceber = escolaId != null ? crRepository.somarPendentesNaoVencidosByEscola(hoje, escolaId) : crRepository.somarPendentesNaoVencidos(hoje);
        BigDecimal cpAPagar   = escolaId != null ? cpRepository.somarPendentesNaoVencidosByEscola(hoje, escolaId) : cpRepository.somarPendentesNaoVencidos(hoje);

        // Inadimplência / atraso
        BigDecimal crVencido  = escolaId != null ? crRepository.somarVencidosByEscola(hoje, escolaId) : crRepository.somarVencidos(hoje);
        BigDecimal cpVencido  = escolaId != null ? cpRepository.somarVencidosByEscola(hoje, escolaId) : cpRepository.somarVencidos(hoje);

        Map<String, Object> kpis = new LinkedHashMap<>();
        kpis.put("crRecebidoMes",     crRecebido);
        kpis.put("entradasAvulsas",   entradasAvulsas);
        kpis.put("totalEntradas",     totalEntradas);
        kpis.put("cpPagoMes",         cpPago);
        kpis.put("saidasAvulsas",     saidasAvulsas);
        kpis.put("totalSaidas",       totalSaidas);
        kpis.put("saldoMes",          saldoMes);
        kpis.put("crAReceber",        crAReceber);
        kpis.put("cpAPagar",          cpAPagar);
        kpis.put("crVencido",         crVencido);   // inadimplência em valor
        kpis.put("cpVencido",         cpVencido);   // CP em atraso em valor

        return kpis;
    }

    // ─── Gráfico: últimos 6 meses ─────────────────────────────────────────────

    private List<Map<String, Object>> calcularGrafico(YearMonth mesAtual, Long escolaId) {
        List<Map<String, Object>> grafico = new ArrayList<>();

        // Do mês mais antigo ao mais recente
        for (int i = 5; i >= 0; i--) {
            YearMonth ym     = mesAtual.minusMonths(i);
            LocalDate inicio = ym.atDay(1);
            LocalDate fim    = ym.atEndOfMonth();

            BigDecimal crRecebido      = escolaId != null ? crRepository.somarRecebidoNoPeriodoByEscola(inicio, fim, escolaId) : crRepository.somarRecebidoNoPeriodo(inicio, fim);
            BigDecimal entradasAvulsas = escolaId != null ? movRepository.somarEntradasNoPeriodoByEscola(inicio, fim, escolaId) : movRepository.somarEntradasNoPeriodo(inicio, fim);
            BigDecimal receitas        = crRecebido.add(entradasAvulsas);

            BigDecimal cpPago          = escolaId != null ? cpRepository.somarPagoNoPeriodoByEscola(inicio, fim, escolaId) : cpRepository.somarPagoNoPeriodo(inicio, fim);
            BigDecimal saidasAvulsas   = escolaId != null ? movRepository.somarSaidasNoPeriodoByEscola(inicio, fim, escolaId) : movRepository.somarSaidasNoPeriodo(inicio, fim);
            BigDecimal despesas        = cpPago.add(saidasAvulsas);

            String nomeMes = ym.getMonth()
                    .getDisplayName(TextStyle.SHORT, PT_BR);
            nomeMes = capitalize(nomeMes) + "/" + ym.getYear();

            Map<String, Object> ponto = new LinkedHashMap<>();
            ponto.put("mes",      ym.toString());
            ponto.put("mesNome",  nomeMes);
            ponto.put("receitas", receitas);
            ponto.put("despesas", despesas);
            ponto.put("saldo",    receitas.subtract(despesas));

            grafico.add(ponto);
        }

        return grafico;
    }

    // ─── Próximos vencimentos (CR + CP — próximos 7 dias) ────────────────────

    private List<Map<String, Object>> calcularProximosVencimentos(LocalDate hoje, Long escolaId) {
        LocalDate limite = hoje.plusDays(7);

        List<Map<String, Object>> vencimentos = new ArrayList<>();

        // CR pendentes no período
        for (FinContaReceber cr : escolaId != null ? crRepository.findProximasPorVencimentoByEscola(hoje, limite, escolaId) : crRepository.findProximasPorVencimento(hoje, limite)) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("modulo",         "CR");
            item.put("id",             cr.getId());
            item.put("descricao",      cr.getDescricao());
            item.put("valor",          cr.getValor());
            item.put("dataVencimento", cr.getDataVencimento());
            item.put("diasRestantes",  hoje.until(cr.getDataVencimento()).getDays());

            if (cr.getContrato() != null) {
                item.put("alunoNome", cr.getContrato().getAluno().getNome());
            }
            if (cr.getPessoa() != null) {
                item.put("pessoaNome", cr.getPessoa().getNome());
            }
            vencimentos.add(item);
        }

        // CP pendentes no período
        for (FinContaPagar cp : escolaId != null ? cpRepository.findProximasPorVencimentoByEscola(hoje, limite, escolaId) : cpRepository.findProximasPorVencimento(hoje, limite)) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("modulo",         "CP");
            item.put("id",             cp.getId());
            item.put("descricao",      cp.getDescricao());
            item.put("tipo",           cp.getTipo());
            item.put("categoria",      cp.getCategoria());
            item.put("valor",          cp.getValor());
            item.put("dataVencimento", cp.getDataVencimento());
            item.put("diasRestantes",  hoje.until(cp.getDataVencimento()).getDays());

            if (cp.getPessoa() != null) {
                item.put("pessoaNome", cp.getPessoa().getNome());
            }
            vencimentos.add(item);
        }

        // Ordena por data de vencimento (mistura CR + CP)
        vencimentos.sort((a, b) -> {
            LocalDate da = (LocalDate) a.get("dataVencimento");
            LocalDate db = (LocalDate) b.get("dataVencimento");
            return da.compareTo(db);
        });

        return vencimentos;
    }

    // ─── Inadimplentes ────────────────────────────────────────────────────────

    private List<Map<String, Object>> calcularInadimplentes(LocalDate hoje, Long escolaId) {
        List<Map<String, Object>> inadimplentes = new ArrayList<>();

        for (FinContaReceber cr : escolaId != null ? crRepository.findVencidasByEscola(hoje, escolaId) : crRepository.findVencidas(hoje)) {
            // Saldo devedor real = valor + juros + multa - já pago
            BigDecimal juros  = cr.getJurosAplicado()  != null ? cr.getJurosAplicado()  : BigDecimal.ZERO;
            BigDecimal multa  = cr.getMultaAplicada()  != null ? cr.getMultaAplicada()  : BigDecimal.ZERO;
            BigDecimal pago   = cr.getValorPago()      != null ? cr.getValorPago()      : BigDecimal.ZERO;
            BigDecimal saldo  = cr.getValor().add(juros).add(multa).subtract(pago);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id",             cr.getId());
            item.put("descricao",      cr.getDescricao());
            item.put("valor",          cr.getValor());
            item.put("saldoDevedor",   saldo.max(BigDecimal.ZERO));
            item.put("valorPago",      pago.compareTo(BigDecimal.ZERO) > 0 ? pago : null);
            item.put("status",         cr.getStatus());
            item.put("dataVencimento", cr.getDataVencimento());
            item.put("diasAtraso",     cr.getDataVencimento().until(hoje).getDays());

            if (cr.getContrato() != null) {
                item.put("alunoId",   cr.getContrato().getAluno().getId());
                item.put("alunoNome", cr.getContrato().getAluno().getNome());
            }
            if (cr.getPessoa() != null) {
                item.put("pessoaId",   cr.getPessoa().getId());
                item.put("pessoaNome", cr.getPessoa().getNome());
                item.put("pessoaTelefone", cr.getPessoa().getTelefone());
            }
            inadimplentes.add(item);
        }

        return inadimplentes;
    }

    // ─── Util ─────────────────────────────────────────────────────────────────

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }
}
