package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinContaReceber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface FinContaReceberRepository extends JpaRepository<FinContaReceber, Long> {

    // Parcelas de um contrato específico, ordenadas por número da parcela
    List<FinContaReceber> findByContratoIdOrderByNumParcelaAsc(Long contratoId);

    // Todas as CRs de um aluno (via contrato)
    @Query("""
        SELECT cr FROM FinContaReceber cr
        WHERE cr.contrato.aluno.id = :alunoId
        ORDER BY cr.dataVencimento ASC
        """)
    List<FinContaReceber> findByAlunoId(@Param("alunoId") Long alunoId);

    // Busca geral com filtros opcionais para a tela de listagem
    // Usa native SQL para evitar falha de inferência de tipo null no Hibernate + PostgreSQL
    @Query(value = """
        SELECT cr.* FROM fin_contas_receber cr
        LEFT JOIN fin_contratos c ON cr.contrato_id = c.id
        WHERE (cast(:alunoId as bigint) IS NULL OR c.aluno_id = cast(:alunoId as bigint))
          AND (cast(:tipo as text) IS NULL OR cr.tipo = cast(:tipo as text))
          AND (cast(:status as text) IS NULL OR cr.status = cast(:status as text))
          AND (cast(:vencimentoDe as date) IS NULL OR cr.data_vencimento >= cast(:vencimentoDe as date))
          AND (cast(:vencimentoAte as date) IS NULL OR cr.data_vencimento <= cast(:vencimentoAte as date))
        ORDER BY cr.data_vencimento ASC
        """, nativeQuery = true)
    List<FinContaReceber> buscar(
            @Param("alunoId") Long alunoId,
            @Param("tipo") String tipo,
            @Param("status") String status,
            @Param("vencimentoDe") LocalDate vencimentoDe,
            @Param("vencimentoAte") LocalDate vencimentoAte
    );

    // Para o dashboard: soma de recebimentos por período
    @Query("""
        SELECT COALESCE(SUM(cr.valorPago), 0)
        FROM FinContaReceber cr
        WHERE cr.status = 'PAGO'
          AND cr.dataPagamento >= :de
          AND cr.dataPagamento <= :ate
        """)
    java.math.BigDecimal somarRecebidoNoPeriodo(
            @Param("de") LocalDate de,
            @Param("ate") LocalDate ate
    );

    // Inadimplentes: PENDENTE com vencimento antes de hoje
    @Query("""
        SELECT cr FROM FinContaReceber cr
        WHERE cr.status = 'PENDENTE'
          AND cr.dataVencimento < :hoje
        ORDER BY cr.dataVencimento ASC
        """)
    List<FinContaReceber> findVencidas(@Param("hoje") LocalDate hoje);

    // Verifica se já existe alguma parcela PAGA de um contrato (para impedir cancelamento)
    boolean existsByContratoIdAndStatus(Long contratoId, String status);

    // Dashboard: soma das CR PENDENTE cujo vencimento ainda não passou (a receber futuro)
    @Query("""
        SELECT COALESCE(SUM(cr.valor), 0)
        FROM FinContaReceber cr
        WHERE cr.status = 'PENDENTE'
          AND cr.dataVencimento >= :hoje
        """)
    java.math.BigDecimal somarPendentesNaoVencidos(@Param("hoje") LocalDate hoje);

    // Dashboard: soma das CR PENDENTE já vencidas (inadimplência em valor)
    @Query("""
        SELECT COALESCE(SUM(cr.valor), 0)
        FROM FinContaReceber cr
        WHERE cr.status = 'PENDENTE'
          AND cr.dataVencimento < :hoje
        """)
    java.math.BigDecimal somarVencidos(@Param("hoje") LocalDate hoje);

    // Dashboard: CR pendentes com vencimento num intervalo (próximos vencimentos)
    @Query("""
        SELECT cr FROM FinContaReceber cr
        WHERE cr.status = 'PENDENTE'
          AND cr.dataVencimento BETWEEN :de AND :ate
        ORDER BY cr.dataVencimento ASC
        """)
    List<FinContaReceber> findProximasPorVencimento(
            @Param("de") LocalDate de,
            @Param("ate") LocalDate ate
    );
}
