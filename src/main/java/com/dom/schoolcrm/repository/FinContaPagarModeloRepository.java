package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinContaPagarModelo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinContaPagarModeloRepository extends JpaRepository<FinContaPagarModelo, Long> {

    List<FinContaPagarModelo> findByAtivoTrueOrderByDescricaoAsc();

    List<FinContaPagarModelo> findAllByOrderByDescricaoAsc();
}
