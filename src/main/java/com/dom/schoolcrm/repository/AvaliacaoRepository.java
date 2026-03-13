package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {
    List<Avaliacao> findByTurmaIdAndMateriaId(Long turmaId, Long materiaId);
    List<Avaliacao> findByTurmaIdAndDataAplicacaoBetween(Long turmaId, LocalDate from, LocalDate to);
    List<Avaliacao> findByDataAplicacaoBetween(LocalDate from, LocalDate to);
}