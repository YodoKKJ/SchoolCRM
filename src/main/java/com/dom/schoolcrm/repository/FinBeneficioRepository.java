package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinBeneficio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FinBeneficioRepository extends JpaRepository<FinBeneficio, Long> {

    List<FinBeneficio> findByFuncionarioIdOrderByTipoAsc(Long funcionarioId);

    List<FinBeneficio> findByFuncionarioIdAndAtivoTrue(Long funcionarioId);
}
