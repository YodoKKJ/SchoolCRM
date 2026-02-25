package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Atraso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AtrasoRepository extends JpaRepository<Atraso, Long> {

    // Atrasos de hoje
    @Query("SELECT a FROM Atraso a WHERE a.registradoEm >= :inicio AND a.registradoEm < :fim ORDER BY a.registradoEm DESC")
    List<Atraso> findByData(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);

    // Histórico de um aluno
    List<Atraso> findByAlunoIdOrderByRegistradoEmDesc(Long alunoId);

    // Todos ordenados por data
    List<Atraso> findAllByOrderByRegistradoEmDesc();
}
