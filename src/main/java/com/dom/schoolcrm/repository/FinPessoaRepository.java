package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinPessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FinPessoaRepository extends JpaRepository<FinPessoa, Long> {

    // Busca com filtros combinados (nome, CPF, CNPJ, tipo)
    @Query("""
        SELECT p FROM FinPessoa p
        WHERE (:nome IS NULL OR LOWER(p.nome) LIKE LOWER(CONCAT('%', :nome, '%')))
          AND (:cpf IS NULL OR p.cpf LIKE CONCAT('%', :cpf, '%'))
          AND (:cnpj IS NULL OR p.cnpj LIKE CONCAT('%', :cnpj, '%'))
          AND (:tipoPessoa IS NULL OR p.tipoPessoa = :tipoPessoa)
          AND (:ativo IS NULL OR p.ativo = :ativo)
        ORDER BY p.nome ASC
        """)
    List<FinPessoa> buscar(
            @Param("nome") String nome,
            @Param("cpf") String cpf,
            @Param("cnpj") String cnpj,
            @Param("tipoPessoa") String tipoPessoa,
            @Param("ativo") Boolean ativo
    );

    Optional<FinPessoa> findByCpf(String cpf);

    Optional<FinPessoa> findByCnpj(String cnpj);

    boolean existsByCpfAndIdNot(String cpf, Long id);

    boolean existsByCnpjAndIdNot(String cnpj, Long id);

    // Todos os que têm vínculo com um usuario de sistema
    List<FinPessoa> findByUsuarioId(Long usuarioId);
}
