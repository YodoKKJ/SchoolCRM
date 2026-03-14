package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.ProfessorTurmaMateria;
import com.dom.schoolcrm.entity.ProfessorTurmaMateriaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfessorTurmaMateriaRepository extends JpaRepository<ProfessorTurmaMateria, ProfessorTurmaMateriaId> {
    List<ProfessorTurmaMateria> findByProfessorId(Long professorId);
    List<ProfessorTurmaMateria> findByTurmaId(Long turmaId);
    void deleteByTurmaId(Long turmaId);

    Optional<ProfessorTurmaMateria> findByIdProfessorIdAndIdTurmaIdAndIdMateriaId(Long professorId, Long turmaId, Long materiaId);
    void deleteByIdProfessorIdAndIdTurmaIdAndIdMateriaId(Long professorId, Long turmaId, Long materiaId);
}