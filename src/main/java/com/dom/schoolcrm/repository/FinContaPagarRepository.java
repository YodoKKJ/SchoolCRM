package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinContaPagar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface FinContaPagarRepository extends JpaRepository<FinContaPagar, Long> {

    List<FinContaPagar> findByEscolaId(Long escolaId);

    // Busca com filtros combinados para a tela de listagem
    // Usa native SQL para evitar falha de inferência de tipo null no Hibernate + PostgreSQL
    @Query(value = """
        SELECT * FROM fin_contas_pagar
        WHERE (cast(:tipo as text) IS NULL OR tipo = cast(:tipo as text))
          AND (cast(:categoria as text) IS NULL OR categoria = cast(:categoria as text))
          AND (cast(:status as text) IS NULL OR status = cast(:status as text))
          AND (cast(:vencimentoDe as date) IS NULL OR data_vencimento >= cast(:vencimentoDe as date))
          AND (cast(:vencimentoAte as date) IS NULL OR data_vencimento <= cast(:vencimentoAte as date))
          AND (cast(:mesReferencia as text) IS NULL OR mes_referencia = cast(:mesReferencia as text))
          AND (cast(:escolaId as bigint) IS NULL OR escola_id = cast(:escolaId as bigint) OR escola_id IS NULL)
        ORDER BY data_vencimento ASC
        """, nativeQuery = true)
    List<FinContaPagar> buscar(
            @Param("tipo") String tipo,
            @Param("categoria") String categoria,
            @Param("status") String status,
            @Param("vencimentoDe") LocalDate vencimentoDe,
            @Param("vencimentoAte") LocalDate vencimentoAte,
            @Param("mesReferencia") String mesReferencia,
            @Param("escolaId") Long escolaId
    );

    // CP vencidas: PENDENTE com dataVencimento anterior a hoje
    @Query("""
        SELECT cp FROM FinContaPagar cp
        WHERE cp.status = 'PENDENTE'
          AND cp.dataVencimento < :hoje
        ORDER BY cp.dataVencimento ASC
        """)
    List<FinContaPagar> findVencidas(@Param("hoje") LocalDate hoje);

    // Verifica duplicidade ao gerar folha: evita gerar 2x o salário no mesmo mês
    boolean existsByFuncionarioIdAndMesReferencia(Long funcionarioId, String mesReferencia);

    // Verifica duplicidade ao gerar recorrentes: evita gerar 2x a conta do modelo no mesmo mês
    boolean existsByModeloIdAndMesReferencia(Long modeloId, String mesReferencia);

    // Soma de pagamentos realizados num período (para dashboard)
    @Query("""
        SELECT COALESCE(SUM(cp.valorPago), 0)
        FROM FinContaPagar cp
        WHERE cp.status = 'PAGO'
          AND cp.dataPagamento >= :de
          AND cp.dataPagamento <= :ate
        """)
    BigDecimal somarPagoNoPeriodo(
            @Param("de") LocalDate de,
            @Param("ate") LocalDate ate
    );

    // Dashboard: saldo a pagar de CP PENDENTE ou PARCIALMENTE_PAGO cujo vencimento ainda não passou
    // Inclui juros e multa já aplicados para refletir o saldo devedor real
    @Query("""
        SELECT COALESCE(SUM(
            cp.valor
            + COALESCE(cp.jurosAplicado, 0)
            + COALESCE(cp.multaAplicada, 0)
            - COALESCE(cp.valorPago, 0)
        ), 0)
        FROM FinContaPagar cp
        WHERE cp.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cp.dataVencimento >= :hoje
        """)
    BigDecimal somarPendentesNaoVencidos(@Param("hoje") LocalDate hoje);

    // Dashboard: CP em atraso — saldo real incluindo juros e multa já aplicados
    @Query("""
        SELECT COALESCE(SUM(
            cp.valor
            + COALESCE(cp.jurosAplicado, 0)
            + COALESCE(cp.multaAplicada, 0)
            - COALESCE(cp.valorPago, 0)
        ), 0)
        FROM FinContaPagar cp
        WHERE cp.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cp.dataVencimento < :hoje
        """)
    BigDecimal somarVencidos(@Param("hoje") LocalDate hoje);

    // Dashboard: CP pendentes com vencimento num intervalo.
    // JOIN FETCH em pessoa evita N+1 queries no dashboard.
    @Query("""
        SELECT cp FROM FinContaPagar cp
        LEFT JOIN FETCH cp.pessoa
        WHERE cp.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cp.dataVencimento BETWEEN :de AND :ate
        ORDER BY cp.dataVencimento ASC
        """)
    List<FinContaPagar> findProximasPorVencimento(
            @Param("de") LocalDate de,
            @Param("ate") LocalDate ate
    );

    // ─── Escola-scoped dashboard queries ──────────────────────────────────────

    @Query("""
        SELECT cp FROM FinContaPagar cp
        WHERE cp.status = 'PENDENTE'
          AND cp.dataVencimento < :hoje
          AND cp.escolaId = :escolaId
        ORDER BY cp.dataVencimento ASC
        """)
    List<FinContaPagar> findVencidasByEscola(@Param("hoje") LocalDate hoje, @Param("escolaId") Long escolaId);

    @Query("""
        SELECT COALESCE(SUM(cp.valorPago), 0)
        FROM FinContaPagar cp
        WHERE cp.status = 'PAGO'
          AND cp.dataPagamento >= :de
          AND cp.dataPagamento <= :ate
          AND cp.escolaId = :escolaId
        """)
    BigDecimal somarPagoNoPeriodoByEscola(
            @Param("de") LocalDate de, @Param("ate") LocalDate ate, @Param("escolaId") Long escolaId);

    @Query("""
        SELECT COALESCE(SUM(
            cp.valor + COALESCE(cp.jurosAplicado, 0) + COALESCE(cp.multaAplicada, 0) - COALESCE(cp.valorPago, 0)
        ), 0)
        FROM FinContaPagar cp
        WHERE cp.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cp.dataVencimento >= :hoje
          AND cp.escolaId = :escolaId
        """)
    BigDecimal somarPendentesNaoVencidosByEscola(@Param("hoje") LocalDate hoje, @Param("escolaId") Long escolaId);

    @Query("""
        SELECT COALESCE(SUM(
            cp.valor + COALESCE(cp.jurosAplicado, 0) + COALESCE(cp.multaAplicada, 0) - COALESCE(cp.valorPago, 0)
        ), 0)
        FROM FinContaPagar cp
        WHERE cp.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cp.dataVencimento < :hoje
          AND cp.escolaId = :escolaId
        """)
    BigDecimal somarVencidosByEscola(@Param("hoje") LocalDate hoje, @Param("escolaId") Long escolaId);

    @Query("""
        SELECT cp FROM FinContaPagar cp
        LEFT JOIN FETCH cp.pessoa
        WHERE cp.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cp.dataVencimento BETWEEN :de AND :ate
          AND cp.escolaId = :escolaId
        ORDER BY cp.dataVencimento ASC
        """)
    List<FinContaPagar> findProximasPorVencimentoByEscola(
            @Param("de") LocalDate de, @Param("ate") LocalDate ate, @Param("escolaId") Long escolaId);
}
