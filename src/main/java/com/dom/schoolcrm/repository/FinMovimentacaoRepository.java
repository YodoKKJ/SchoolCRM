package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface FinMovimentacaoRepository extends JpaRepository<FinMovimentacao, Long> {

    List<FinMovimentacao> findByEscolaId(Long escolaId);

    // Busca com filtros combinados para a tela de listagem
    // Usa native SQL para evitar falha de inferência de tipo null no Hibernate + PostgreSQL
    @Query(value = """
        SELECT * FROM fin_movimentacoes
        WHERE (cast(:tipo as text) IS NULL OR tipo = cast(:tipo as text))
          AND (cast(:categoria as text) IS NULL OR LOWER(categoria) LIKE LOWER(CONCAT('%', cast(:categoria as text), '%')))
          AND (cast(:de as date) IS NULL OR data_movimentacao >= cast(:de as date))
          AND (cast(:ate as date) IS NULL OR data_movimentacao <= cast(:ate as date))
          AND (cast(:escolaId as bigint) IS NULL OR escola_id = cast(:escolaId as bigint))
        ORDER BY data_movimentacao DESC, created_at DESC
        """, nativeQuery = true)
    List<FinMovimentacao> buscar(
            @Param("tipo") String tipo,
            @Param("categoria") String categoria,
            @Param("de") LocalDate de,
            @Param("ate") LocalDate ate,
            @Param("escolaId") Long escolaId
    );

    // Soma de entradas num período (para dashboard e resumo)
    @Query("""
        SELECT COALESCE(SUM(m.valor), 0)
        FROM FinMovimentacao m
        WHERE m.tipo = 'ENTRADA'
          AND m.dataMovimentacao >= :de
          AND m.dataMovimentacao <= :ate
        """)
    BigDecimal somarEntradasNoPeriodo(@Param("de") LocalDate de, @Param("ate") LocalDate ate);

    // Soma de saídas num período
    @Query("""
        SELECT COALESCE(SUM(m.valor), 0)
        FROM FinMovimentacao m
        WHERE m.tipo = 'SAIDA'
          AND m.dataMovimentacao >= :de
          AND m.dataMovimentacao <= :ate
        """)
    BigDecimal somarSaidasNoPeriodo(@Param("de") LocalDate de, @Param("ate") LocalDate ate);

    // ─── Escola-scoped dashboard queries ──────────────────────────────────────

    @Query("""
        SELECT COALESCE(SUM(m.valor), 0)
        FROM FinMovimentacao m
        WHERE m.tipo = 'ENTRADA'
          AND m.dataMovimentacao >= :de
          AND m.dataMovimentacao <= :ate
          AND m.escolaId = :escolaId
        """)
    BigDecimal somarEntradasNoPeriodoByEscola(@Param("de") LocalDate de, @Param("ate") LocalDate ate, @Param("escolaId") Long escolaId);

    @Query("""
        SELECT COALESCE(SUM(m.valor), 0)
        FROM FinMovimentacao m
        WHERE m.tipo = 'SAIDA'
          AND m.dataMovimentacao >= :de
          AND m.dataMovimentacao <= :ate
          AND m.escolaId = :escolaId
        """)
    BigDecimal somarSaidasNoPeriodoByEscola(@Param("de") LocalDate de, @Param("ate") LocalDate ate, @Param("escolaId") Long escolaId);
}
