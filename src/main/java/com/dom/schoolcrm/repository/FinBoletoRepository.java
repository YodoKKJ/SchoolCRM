package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinBoleto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinBoletoRepository extends JpaRepository<FinBoleto, Long> {

    // Boleto(s) de uma conta a receber específica
    List<FinBoleto> findByContaReceberId(Long contaReceberId);

    // Boleto ativo (EMITIDO) de uma conta a receber — evita duplicidade
    Optional<FinBoleto> findByContaReceberIdAndStatus(Long contaReceberId, String status);

    // Buscar por nosso número (identificador único no banco)
    Optional<FinBoleto> findByNossoNumero(String nossoNumero);

    // Buscar por ID do Sicoob
    Optional<FinBoleto> findBySicoobId(String sicoobId);

    // Todos os boletos de um contrato (via conta a receber)
    @Query("""
        SELECT b FROM FinBoleto b
        JOIN b.contaReceber cr
        WHERE cr.contrato.id = :contratoId
        ORDER BY cr.numParcela ASC
        """)
    List<FinBoleto> findByContratoId(@Param("contratoId") Long contratoId);

    // Boletos por status
    List<FinBoleto> findByStatusOrderByDataVencimentoAsc(String status);

    // Boletos emitidos com vencimento vencido (para rotina de atualização de status)
    @Query("""
        SELECT b FROM FinBoleto b
        WHERE b.status = 'EMITIDO'
          AND b.dataVencimento < :hoje
        ORDER BY b.dataVencimento ASC
        """)
    List<FinBoleto> findEmitidosVencidos(@Param("hoje") LocalDate hoje);

    // Busca geral com filtros opcionais
    @Query(value = """
        SELECT b.* FROM fin_boletos b
        JOIN fin_contas_receber cr ON b.conta_receber_id = cr.id
        LEFT JOIN fin_contratos c ON cr.contrato_id = c.id
        WHERE (cast(:status as text) IS NULL OR b.status = cast(:status as text))
          AND (cast(:alunoId as bigint) IS NULL OR c.aluno_id = cast(:alunoId as bigint))
          AND (cast(:vencimentoDe as date) IS NULL OR b.data_vencimento >= cast(:vencimentoDe as date))
          AND (cast(:vencimentoAte as date) IS NULL OR b.data_vencimento <= cast(:vencimentoAte as date))
        ORDER BY b.data_vencimento ASC
        """, nativeQuery = true)
    List<FinBoleto> buscar(
            @Param("status") String status,
            @Param("alunoId") Long alunoId,
            @Param("vencimentoDe") LocalDate vencimentoDe,
            @Param("vencimentoAte") LocalDate vencimentoAte
    );
}
