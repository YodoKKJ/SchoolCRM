package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinContrato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinContratoRepository extends JpaRepository<FinContrato, Long> {

    List<FinContrato> findByAlunoIdOrderByAnoLetivoDesc(Long alunoId);

    List<FinContrato> findByAnoLetivoOrderByAlunoNomeAsc(Integer anoLetivo);

    Optional<FinContrato> findByAlunoIdAndAnoLetivo(Long alunoId, Integer anoLetivo);

    List<FinContrato> findByEscolaId(Long escolaId);

    List<FinContrato> findByEscolaIdAndAnoLetivoOrderByAlunoNomeAsc(Long escolaId, Integer anoLetivo);

    List<FinContrato> findByEscolaIdAndAlunoIdOrderByAnoLetivoDesc(Long escolaId, Long alunoId);
}
