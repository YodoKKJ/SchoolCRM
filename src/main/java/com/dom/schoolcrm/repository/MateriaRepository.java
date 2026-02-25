package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, Long> {

    @Query("SELECT m FROM Materia m WHERE (:nome IS NULL OR LOWER(m.nome) LIKE LOWER(CONCAT('%', :nome, '%')))")
    List<Materia> buscar(@Param("nome") String nome);
}