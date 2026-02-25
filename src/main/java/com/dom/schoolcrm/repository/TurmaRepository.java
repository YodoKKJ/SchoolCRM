package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TurmaRepository extends JpaRepository<Turma, Long> {

    List<Turma> findBySerieId(Long serieId);

    @Query("SELECT t FROM Turma t WHERE " +
            "(:nome IS NULL OR LOWER(t.nome) LIKE LOWER(CONCAT('%', :nome, '%'))) AND " +
            "(:serieId IS NULL OR t.serie.id = :serieId)")
    List<Turma> buscar(@Param("nome") String nome, @Param("serieId") Long serieId);
}