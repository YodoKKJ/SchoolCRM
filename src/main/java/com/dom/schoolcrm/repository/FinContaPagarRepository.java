package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinContaPagar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface FinContaPagarRepository extends JpaRepository<FinContaPagar, Long> {

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
        ORDER BY data_vencimento ASC
        """, nativeQuery = true)
    List<FinContaPagar> buscar(
            @Param("tipo") String tipo,
            @Param("categoria") String categoria,
            @Param("status") String status,
            @Param("vencimentoDe") LocalDate vencimentoDe,
            @Param("vencimentoAte") LocalDate vencimentoAte,
            @Param("mesReferencia") String mesReferencia
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

    // Dashboard: soma das CP PENDENTE cujo vencimento ainda não passou
    @Query("""
        SELECT COALESCE(SUM(cp.valor), 0)
        FROM FinContaPagar cp
        WHERE cp.status = 'PENDENTE'
          AND cp.dataVencimento >= :hoje
        """)
    BigDecimal somarPendentesNaoVencidos(@Param("hoje") LocalDate hoje);

    // Dashboard: soma das CP PENDENTE já vencidas
    @Query("""
        SELECT COALESCE(SUM(cp.valor), 0)
        FROM FinContaPagar cp
        WHERE cp.status = 'PENDENTE'
          AND cp.dataVencimento < :hoje
        """)
    BigDecimal somarVencidos(@Param("hoje") LocalDate hoje);

    // Dashboard: CP pendentes com vencimento num intervalo (próximos vencimentos)
    @Query("""
        SELECT cp FROM FinContaPagar cp
        WHERE cp.status = 'PENDENTE'
          AND cp.dataVencimento BETWEEN :de AND :ate
        ORDER BY cp.dataVencimento ASC
        """)
    List<FinContaPagar> findProximasPorVencimento(
            @Param("de") LocalDate de,
            @Param("ate") LocalDate ate
    );
}
