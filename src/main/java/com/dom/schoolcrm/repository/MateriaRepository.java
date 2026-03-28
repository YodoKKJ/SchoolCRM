package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, Long> {

    List<Materia> findByEscolaId(Long escolaId);

    @Query(value = "SELECT * FROM materias WHERE " +
           "(CAST(:nome AS TEXT) IS NULL OR LOWER(nome) LIKE LOWER('%' || CAST(:nome AS TEXT) || '%')) AND " +
           "(CAST(:escolaId AS BIGINT) IS NULL OR escola_id = CAST(:escolaId AS BIGINT))",
           nativeQuery = true)
    List<Materia> buscar(@Param("nome") String nome, @Param("escolaId") Long escolaId);
}