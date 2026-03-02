package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.FinPessoa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FinPessoaRepository extends JpaRepository<FinPessoa, Long> {

    // Busca com filtros combinados (nome, CPF, CNPJ, tipo)
    // Usa native SQL para evitar falha de inferência de tipo null no Hibernate + PostgreSQL
    @Query(value = """
        SELECT * FROM fin_pessoas
        WHERE (cast(:nome as text) IS NULL OR LOWER(nome) LIKE LOWER(CONCAT('%', :nome, '%')))
          AND (cast(:cpf as text) IS NULL OR cpf LIKE CONCAT('%', :cpf, '%'))
          AND (cast(:cnpj as text) IS NULL OR cnpj LIKE CONCAT('%', :cnpj, '%'))
          AND (cast(:tipoPessoa as text) IS NULL OR tipo_pessoa = :tipoPessoa)
          AND (cast(:ativo as boolean) IS NULL OR ativo = cast(:ativo as boolean))
        ORDER BY nome ASC
        """, nativeQuery = true)
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
