package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByLogin(String login);

    @Query("SELECT u FROM Usuario u WHERE " +
           "(:nome IS NULL OR LOWER(u.nome) LIKE LOWER(CONCAT('%', :nome, '%'))) AND " +
           "(:role IS NULL OR LOWER(u.role) LIKE LOWER(CONCAT('%', :role, '%')))")
    List<Usuario> buscar(@Param("nome") String nome, @Param("role") String role);
}