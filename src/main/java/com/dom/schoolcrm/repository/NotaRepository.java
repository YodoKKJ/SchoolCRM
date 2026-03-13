package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Nota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Long> {
    List<Nota> findByAlunoId(Long alunoId);
    List<Nota> findByAvaliacaoId(Long avaliacaoId);
    Optional<Nota> findByAvaliacaoIdAndAlunoId(Long avaliacaoId, Long alunoId);
    List<Nota> findByAlunoIdAndAvaliacaoTurmaIdAndAvaliacaoMateriaId(Long alunoId, Long turmaId, Long materiaId);

    // Relatório de turma: todas as notas de uma turma em uma query (evita N+1)
    List<Nota> findByAvaliacaoTurmaId(Long turmaId);
}