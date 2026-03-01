package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinResponsavelAluno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinResponsavelAlunoRepository extends JpaRepository<FinResponsavelAluno, Long> {

    List<FinResponsavelAluno> findByAlunoId(Long alunoId);

    // Verifica se já existe um PRINCIPAL para esse aluno
    Optional<FinResponsavelAluno> findByAlunoIdAndTipo(Long alunoId, String tipo);

    boolean existsByPessoaIdAndAlunoId(Long pessoaId, Long alunoId);

    // Verifica se uma pessoa é responsável de algum aluno (para bloquear exclusão)
    boolean existsByPessoaId(Long pessoaId);
}
