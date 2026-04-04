package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinConvenio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinConvenioRepository extends JpaRepository<FinConvenio, Long> {

    List<FinConvenio> findBySicoobConfigIdOrderByNumeroAsc(Long configId);

    List<FinConvenio> findBySicoobConfigIdAndSituacao(Long configId, String situacao);

    Optional<FinConvenio> findFirstBySicoobConfigIdAndSituacao(Long configId, String situacao);
}
