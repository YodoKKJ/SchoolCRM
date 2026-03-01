package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinMovimentacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface FinMovimentacaoRepository extends JpaRepository<FinMovimentacao, Long> {

    // Busca com filtros combinados para a tela de listagem
    @Query("""
        SELECT m FROM FinMovimentacao m
        WHERE (:tipo IS NULL OR m.tipo = :tipo)
          AND (:categoria IS NULL OR LOWER(m.categoria) LIKE LOWER(CONCAT('%', :categoria, '%')))
          AND (:de IS NULL OR m.dataMovimentacao >= :de)
          AND (:ate IS NULL OR m.dataMovimentacao <= :ate)
        ORDER BY m.dataMovimentacao DESC, m.createdAt DESC
        """)
    List<FinMovimentacao> buscar(
            @Param("tipo") String tipo,
            @Param("categoria") String categoria,
            @Param("de") LocalDate de,
            @Param("ate") LocalDate ate
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
}
