package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinHistoricoPagamentoCP;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinHistoricoPagamentoCPRepository extends JpaRepository<FinHistoricoPagamentoCP, Long> {

    List<FinHistoricoPagamentoCP> findByContaPagarIdOrderByDataRegistroAsc(Long contaPagarId);
}
