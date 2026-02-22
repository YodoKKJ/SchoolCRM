package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.AlunoTurma;
import com.dom.schoolcrm.entity.AlunoTurmaId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlunoTurmaRepository extends JpaRepository<AlunoTurma, AlunoTurmaId> {
    List<AlunoTurma> findByTurmaId(Long turmaId);
    List<AlunoTurma> findByAlunoId(Long alunoId);
}