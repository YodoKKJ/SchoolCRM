package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Presenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PresencaRepository extends JpaRepository<Presenca, Long> {
    List<Presenca> findByAlunoIdAndTurmaIdAndMateriaId(Long alunoId, Long turmaId, Long materiaId);
    List<Presenca> findByTurmaIdAndMateriaId(Long turmaId, Long materiaId);
    Optional<Presenca> findByAlunoIdAndMateriaIdAndData(Long alunoId, Long materiaId, java.time.LocalDate data);
}