package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinConfiguracao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinConfiguracaoRepository extends JpaRepository<FinConfiguracao, Long> {

    java.util.Optional<FinConfiguracao> findByEscolaId(Long escolaId);
}
