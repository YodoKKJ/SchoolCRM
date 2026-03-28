package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinContaReceber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface FinContaReceberRepository extends JpaRepository<FinContaReceber, Long> {

    // Parcelas de um contrato específico, ordenadas por número da parcela
    List<FinContaReceber> findByContratoIdOrderByNumParcelaAsc(Long contratoId);

    List<FinContaReceber> findByEscolaId(Long escolaId);

    // Todas as CRs de um aluno (via contrato)
    @Query("""
        SELECT cr FROM FinContaReceber cr
        WHERE cr.contrato.aluno.id = :alunoId
        ORDER BY cr.dataVencimento ASC
        """)
    List<FinContaReceber> findByAlunoId(@Param("alunoId") Long alunoId);

    // Busca geral com filtros opcionais para a tela de listagem
    // Usa native SQL para evitar falha de inferência de tipo null no Hibernate + PostgreSQL
    // Quando alunoId é informado, inclui tanto CRs de contrato quanto avulsas vinculadas
    // à FinPessoa do aluno (via usuario_id na tabela fin_pessoas)
    @Query(value = """
        SELECT cr.* FROM fin_contas_receber cr
        LEFT JOIN fin_contratos c ON cr.contrato_id = c.id
        WHERE (
            cast(:alunoId as bigint) IS NULL
            OR (cr.contrato_id IS NOT NULL AND c.aluno_id = cast(:alunoId as bigint))
            OR (cr.contrato_id IS NULL AND cr.pessoa_id IN (
                SELECT p.id FROM fin_pessoas p WHERE p.usuario_id = cast(:alunoId as bigint)
            ))
        )
          AND (cast(:tipo as text) IS NULL OR cr.tipo = cast(:tipo as text))
          AND (cast(:status as text) IS NULL OR cr.status = cast(:status as text))
          AND (cast(:vencimentoDe as date) IS NULL OR cr.data_vencimento >= cast(:vencimentoDe as date))
          AND (cast(:vencimentoAte as date) IS NULL OR cr.data_vencimento <= cast(:vencimentoAte as date))
          AND (cast(:escolaId as bigint) IS NULL OR cr.escola_id = cast(:escolaId as bigint))
        ORDER BY cr.data_vencimento ASC
        """, nativeQuery = true)
    List<FinContaReceber> buscar(
            @Param("alunoId") Long alunoId,
            @Param("tipo") String tipo,
            @Param("status") String status,
            @Param("vencimentoDe") LocalDate vencimentoDe,
            @Param("vencimentoAte") LocalDate vencimentoAte,
            @Param("escolaId") Long escolaId
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

    // Inadimplentes: PENDENTE ou PARCIALMENTE_PAGO com vencimento antes de hoje.
    // JOIN FETCH em contrato→aluno e pessoa evita N+1 queries no dashboard.
    @Query("""
        SELECT cr FROM FinContaReceber cr
        LEFT JOIN FETCH cr.contrato c
        LEFT JOIN FETCH c.aluno
        LEFT JOIN FETCH cr.pessoa
        WHERE cr.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cr.dataVencimento < :hoje
        ORDER BY cr.dataVencimento ASC
        """)
    List<FinContaReceber> findVencidas(@Param("hoje") LocalDate hoje);

    // WhatsApp Job: vencidas com JOIN FETCH no responsável do contrato
    @Query("""
        SELECT cr FROM FinContaReceber cr
        LEFT JOIN FETCH cr.contrato c
        LEFT JOIN FETCH c.responsavelPrincipal
        LEFT JOIN FETCH cr.pessoa
        WHERE cr.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cr.dataVencimento < :hoje
        ORDER BY cr.dataVencimento ASC
        """)
    List<FinContaReceber> findVencidasParaNotificacao(@Param("hoje") LocalDate hoje);

    // Verifica se já existe alguma parcela PAGA de um contrato (para impedir cancelamento)
    boolean existsByContratoIdAndStatus(Long contratoId, String status);

    // Exclui atomicamente uma CR avulsa não paga — previne race condition entre leitura e deleção.
    // Retorna 1 se excluiu, 0 se as condições não foram satisfeitas (pago ou parcela de contrato).
    @Modifying
    @Query("""
        DELETE FROM FinContaReceber cr
        WHERE cr.id = :id
          AND cr.status NOT IN ('PAGO', 'PARCIALMENTE_PAGO')
          AND cr.contrato IS NULL
        """)
    int deleteAvulsaNaoPaga(@Param("id") Long id);

    // Dashboard: saldo a receber de CR PENDENTE ou PARCIALMENTE_PAGO cujo vencimento ainda não passou
    // Usa (valor - valorPago) para refletir o que ainda falta pagar em parciais
    @Query("""
        SELECT COALESCE(SUM(cr.valor - COALESCE(cr.valorPago, 0)), 0)
        FROM FinContaReceber cr
        WHERE cr.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cr.dataVencimento >= :hoje
        """)
    java.math.BigDecimal somarPendentesNaoVencidos(@Param("hoje") LocalDate hoje);

    // Dashboard: inadimplência real = saldo devedor (valor + juros + multa - valorPago)
    // de CRs PENDENTE ou PARCIALMENTE_PAGO já vencidas
    @Query("""
        SELECT COALESCE(SUM(
            cr.valor
            + COALESCE(cr.jurosAplicado, 0)
            + COALESCE(cr.multaAplicada, 0)
            - COALESCE(cr.valorPago, 0)
        ), 0)
        FROM FinContaReceber cr
        WHERE cr.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cr.dataVencimento < :hoje
        """)
    java.math.BigDecimal somarVencidos(@Param("hoje") LocalDate hoje);

    // Dashboard: CR pendentes com vencimento num intervalo.
    // JOIN FETCH em contrato→aluno e pessoa evita N+1 queries no dashboard.
    @Query("""
        SELECT cr FROM FinContaReceber cr
        LEFT JOIN FETCH cr.contrato c
        LEFT JOIN FETCH c.aluno
        LEFT JOIN FETCH cr.pessoa
        WHERE cr.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cr.dataVencimento BETWEEN :de AND :ate
        ORDER BY cr.dataVencimento ASC
        """)
    List<FinContaReceber> findProximasPorVencimento(
            @Param("de") LocalDate de,
            @Param("ate") LocalDate ate
    );

    // WhatsApp Job: mesma query mas com JOIN FETCH no responsável do contrato
    // para evitar N+1 ao montar a mensagem
    @Query("""
        SELECT cr FROM FinContaReceber cr
        LEFT JOIN FETCH cr.contrato c
        LEFT JOIN FETCH c.responsavelPrincipal
        LEFT JOIN FETCH cr.pessoa
        WHERE cr.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cr.dataVencimento BETWEEN :de AND :ate
        ORDER BY cr.dataVencimento ASC
        """)
    List<FinContaReceber> findParaNotificacao(
            @Param("de") LocalDate de,
            @Param("ate") LocalDate ate
    );

    // ─── Escola-scoped dashboard queries ──────────────────────────────────────

    @Query("""
        SELECT COALESCE(SUM(cr.valorPago), 0)
        FROM FinContaReceber cr
        WHERE cr.status = 'PAGO'
          AND cr.dataPagamento >= :de
          AND cr.dataPagamento <= :ate
          AND cr.escolaId = :escolaId
        """)
    java.math.BigDecimal somarRecebidoNoPeriodoByEscola(
            @Param("de") LocalDate de, @Param("ate") LocalDate ate, @Param("escolaId") Long escolaId);

    @Query("""
        SELECT cr FROM FinContaReceber cr
        LEFT JOIN FETCH cr.contrato c
        LEFT JOIN FETCH c.aluno
        LEFT JOIN FETCH cr.pessoa
        WHERE cr.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cr.dataVencimento < :hoje
          AND cr.escolaId = :escolaId
        ORDER BY cr.dataVencimento ASC
        """)
    List<FinContaReceber> findVencidasByEscola(@Param("hoje") LocalDate hoje, @Param("escolaId") Long escolaId);

    @Query("""
        SELECT COALESCE(SUM(cr.valor - COALESCE(cr.valorPago, 0)), 0)
        FROM FinContaReceber cr
        WHERE cr.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cr.dataVencimento >= :hoje
          AND cr.escolaId = :escolaId
        """)
    java.math.BigDecimal somarPendentesNaoVencidosByEscola(@Param("hoje") LocalDate hoje, @Param("escolaId") Long escolaId);

    @Query("""
        SELECT COALESCE(SUM(
            cr.valor + COALESCE(cr.jurosAplicado, 0) + COALESCE(cr.multaAplicada, 0) - COALESCE(cr.valorPago, 0)
        ), 0)
        FROM FinContaReceber cr
        WHERE cr.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cr.dataVencimento < :hoje
          AND cr.escolaId = :escolaId
        """)
    java.math.BigDecimal somarVencidosByEscola(@Param("hoje") LocalDate hoje, @Param("escolaId") Long escolaId);

    @Query("""
        SELECT cr FROM FinContaReceber cr
        LEFT JOIN FETCH cr.contrato c
        LEFT JOIN FETCH c.aluno
        LEFT JOIN FETCH cr.pessoa
        WHERE cr.status IN ('PENDENTE', 'PARCIALMENTE_PAGO')
          AND cr.dataVencimento BETWEEN :de AND :ate
          AND cr.escolaId = :escolaId
        ORDER BY cr.dataVencimento ASC
        """)
    List<FinContaReceber> findProximasPorVencimentoByEscola(
            @Param("de") LocalDate de, @Param("ate") LocalDate ate, @Param("escolaId") Long escolaId);
}
