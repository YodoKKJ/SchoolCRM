package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinFormaPagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinFormaPagamentoRepository extends JpaRepository<FinFormaPagamento, Long> {

    List<FinFormaPagamento> findAllByOrderByNomeAsc();

    List<FinFormaPagamento> findByAtivoTrueOrderByNomeAsc();

    boolean existsByNomeIgnoreCase(String nome);
}
