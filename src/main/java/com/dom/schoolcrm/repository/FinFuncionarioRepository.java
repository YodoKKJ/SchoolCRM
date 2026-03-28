package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinFuncionario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinFuncionarioRepository extends JpaRepository<FinFuncionario, Long> {

    List<FinFuncionario> findByAtivoTrueOrderByPessoaNomeAsc();

    List<FinFuncionario> findAllByOrderByPessoaNomeAsc();

    // Impede cadastrar a mesma pessoa como funcionário duas vezes
    Optional<FinFuncionario> findByPessoaId(Long pessoaId);

    List<FinFuncionario> findByEscolaId(Long escolaId);

    List<FinFuncionario> findByEscolaIdAndAtivoTrueOrderByPessoaNomeAsc(Long escolaId);

    List<FinFuncionario> findByEscolaIdOrderByPessoaNomeAsc(Long escolaId);
}
