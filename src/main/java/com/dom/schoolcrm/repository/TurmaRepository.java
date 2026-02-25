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

    @Query(value = "SELECT * FROM turmas WHERE " +
            "(CAST(:nome AS TEXT) IS NULL OR LOWER(nome) LIKE LOWER('%' || CAST(:nome AS TEXT) || '%')) AND " +
            "(:serieId IS NULL OR serie_id = :serieId)",
            nativeQuery = true)
    List<Turma> buscar(@Param("nome") String nome, @Param("serieId") Long serieId);
}