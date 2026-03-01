package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinSerieValor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinSerieValorRepository extends JpaRepository<FinSerieValor, Long> {

    List<FinSerieValor> findByAnoLetivo(Integer anoLetivo);

    Optional<FinSerieValor> findBySerieIdAndAnoLetivo(Long serieId, Integer anoLetivo);
}
