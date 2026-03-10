package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Horario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioRepository extends JpaRepository<Horario, Long> {

    // --- Somente registros ativos (sem data_fim_vigencia) — grade atual ---

    List<Horario> findByTurmaIdAndDataFimVigenciaIsNullOrderByOrdemAulaAsc(Long turmaId);

    List<Horario> findByDataFimVigenciaIsNullOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc();

    List<Horario> findByTurmaIdInAndDataFimVigenciaIsNullOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc(List<Long> turmaIds);

    List<Horario> findByTurmaIdAndDiaSemanaAndDataFimVigenciaIsNullOrderByOrdemAulaAsc(Long turmaId, String diaSemana);

    Optional<Horario> findByTurmaIdAndDiaSemanaAndOrdemAulaAndDataFimVigenciaIsNull(Long turmaId, String diaSemana, Integer ordemAula);

    /** Todos os registros ativos de uma turma (usado no salvarLote para versionar). */
    List<Horario> findByTurmaIdAndDataFimVigenciaIsNull(Long turmaId);

    // --- Consulta histórica: horários vigentes em uma data específica ---

    @Query("SELECT h FROM Horario h WHERE h.turma.id = :turmaId AND h.diaSemana = :diaSemana " +
           "AND (h.dataInicioVigencia IS NULL OR h.dataInicioVigencia <= :data) " +
           "AND (h.dataFimVigencia IS NULL OR h.dataFimVigencia >= :data) " +
           "ORDER BY h.ordemAula ASC")
    List<Horario> findAtivosNaDataByTurmaAndDia(@Param("turmaId") Long turmaId,
                                                 @Param("diaSemana") String diaSemana,
                                                 @Param("data") LocalDate data);

    // --- Delete físico (limpeza manual pela direção) ---

    @Modifying
    @Transactional
    @Query("DELETE FROM Horario h WHERE h.turma.id = :turmaId")
    void deleteByTurmaId(@Param("turmaId") Long turmaId);
}
