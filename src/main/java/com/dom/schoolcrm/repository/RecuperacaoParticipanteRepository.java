package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.RecuperacaoParticipante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecuperacaoParticipanteRepository extends JpaRepository<RecuperacaoParticipante, Long> {
    List<RecuperacaoParticipante> findByAvaliacaoId(Long avaliacaoId);
    void deleteByAvaliacaoId(Long avaliacaoId);
    boolean existsByAvaliacaoIdAndAlunoId(Long avaliacaoId, Long alunoId);
}
