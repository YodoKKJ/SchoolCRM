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

    @Query(value = "SELECT * FROM usuarios WHERE " +
           "(CAST(:nome AS TEXT) IS NULL OR LOWER(nome) LIKE LOWER('%' || CAST(:nome AS TEXT) || '%')) AND " +
           "(CAST(:role AS TEXT) IS NULL OR LOWER(role) LIKE LOWER('%' || CAST(:role AS TEXT) || '%'))",
           nativeQuery = true)
    List<Usuario> buscar(@Param("nome") String nome, @Param("role") String role);
}