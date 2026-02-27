package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Horario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HorarioRepository extends JpaRepository<Horario, Long> {

    List<Horario> findByTurmaIdOrderByOrdemAula(Long turmaId);

    List<Horario> findByTurmaIdAndDiaSemanaOrderByOrdemAula(Long turmaId, String diaSemana);

    List<Horario> findAllByOrderByTurmaIdAscDiaSemanaAscOrdemAulaAsc();

    Optional<Horario> findByTurmaIdAndDiaSemanaAndOrdemAula(Long turmaId, String diaSemana, Integer ordemAula);

    void deleteByTurmaId(Long turmaId);
}
