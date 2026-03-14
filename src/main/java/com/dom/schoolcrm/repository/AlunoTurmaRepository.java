package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.AlunoTurma;
import com.dom.schoolcrm.entity.AlunoTurmaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlunoTurmaRepository extends JpaRepository<AlunoTurma, AlunoTurmaId> {
    List<AlunoTurma> findByTurmaId(Long turmaId);
    List<AlunoTurma> findByAlunoId(Long alunoId);
    void deleteByTurmaId(Long turmaId);

    Optional<AlunoTurma> findByIdAlunoIdAndIdTurmaId(Long alunoId, Long turmaId);
    void deleteByIdAlunoIdAndIdTurmaId(Long alunoId, Long turmaId);

    @Query("SELECT at.id.alunoId FROM AlunoTurma at WHERE at.turma.anoLetivo = :anoLetivo")
    List<Long> findAlunoIdsByAnoLetivo(@Param("anoLetivo") Integer anoLetivo);
}