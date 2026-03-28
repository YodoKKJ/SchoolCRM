package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.Escola;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EscolaRepository extends JpaRepository<Escola, Long> {
    Optional<Escola> findBySlug(String slug);
    Optional<Escola> findBySlugAndAtivoTrue(String slug);
}
