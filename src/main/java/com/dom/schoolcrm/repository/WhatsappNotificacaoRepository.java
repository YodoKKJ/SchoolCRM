package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.WhatsappNotificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface WhatsappNotificacaoRepository extends JpaRepository<WhatsappNotificacao, Long> {

    /**
     * Verifica se já foi enviada notificação para uma CR + tipo no dia de hoje.
     * Previne envio duplicado no mesmo dia (ex: se o cron rodar 2x).
     */
    @Query("""
        SELECT COUNT(n) > 0 FROM WhatsappNotificacao n
        WHERE n.contaReceber.id = :crId
          AND n.tipo = :tipo
          AND n.status = 'ENVIADO'
          AND n.enviadoEm >= :inicioDia
        """)
    boolean existsByContaReceberIdAndTipoHoje(
            @Param("crId") Long crId,
            @Param("tipo") String tipo,
            @Param("inicioDia") LocalDateTime inicioDia
    );

    /**
     * Últimas N notificações (para exibição no painel admin).
     */
    @Query("""
        SELECT n FROM WhatsappNotificacao n
        LEFT JOIN FETCH n.contaReceber
        LEFT JOIN FETCH n.pessoa
        ORDER BY n.enviadoEm DESC
        """)
    List<WhatsappNotificacao> findUltimas();

    /**
     * Contagem de notificações enviadas em um período (para dashboard).
     */
    @Query("""
        SELECT COUNT(n) FROM WhatsappNotificacao n
        WHERE n.status = 'ENVIADO'
          AND n.enviadoEm >= :de
          AND n.enviadoEm <= :ate
        """)
    long contarEnviadasNoPeriodo(
            @Param("de") LocalDateTime de,
            @Param("ate") LocalDateTime ate
    );
}
