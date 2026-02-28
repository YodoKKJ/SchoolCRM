package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Horario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioRepository extends JpaRepository<Horario, Long> {

    List<Horario> findByTurmaIdOrderByOrdemAula(Long turmaId);

    List<Horario> findByTurmaIdAndDiaSemanaOrderByOrdemAula(Long turmaId, String diaSemana);

    List<Horario> findAllByOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc();

    Optional<Horario> findByTurmaIdAndDiaSemanaAndOrdemAula(Long turmaId, String diaSemana, Integer ordemAula);

    List<Horario> findByTurmaIdInOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc(List<Long> turmaIds);

    @Modifying
    @Transactional
    @Query("DELETE FROM Horario h WHERE h.turma.id = :turmaId")
    void deleteByTurmaId(@Param("turmaId") Long turmaId);
}
