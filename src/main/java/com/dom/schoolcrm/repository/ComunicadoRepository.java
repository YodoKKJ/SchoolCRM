package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Comunicado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComunicadoRepository extends JpaRepository<Comunicado, Long> {
    List<Comunicado> findByAtivoTrueOrderByDataPublicacaoDesc();
}
