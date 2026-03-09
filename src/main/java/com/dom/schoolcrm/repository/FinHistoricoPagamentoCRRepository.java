package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinHistoricoPagamentoCR;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinHistoricoPagamentoCRRepository extends JpaRepository<FinHistoricoPagamentoCR, Long> {
    List<FinHistoricoPagamentoCR> findByContaReceberIdOrderByDataRegistroAsc(Long contaReceberId);
}
