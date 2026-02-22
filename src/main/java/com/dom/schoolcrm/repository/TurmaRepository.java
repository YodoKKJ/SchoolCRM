package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TurmaRepository extends JpaRepository<Turma, Long> {
    List<Turma> findBySerieId(Long serieId);
}