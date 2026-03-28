package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Escola;
import com.dom.schoolcrm.repository.EscolaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/escolas")
public class EscolaController {

    @Autowired
    private EscolaRepository escolaRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECAO') or hasRole('MASTER')")
    public List<Escola> listar() {
        return escolaRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECAO') or hasRole('MASTER')")
    public ResponseEntity<Escola> buscar(@PathVariable Long id) {
        return escolaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECAO') or hasRole('MASTER')")
    public Escola criar(@RequestBody Escola escola) {
        escola.setSlug(gerarSlug(escola.getNome()));
        return escolaRepository.save(escola);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECAO') or hasRole('MASTER')")
    public ResponseEntity<Escola> atualizar(@PathVariable Long id, @RequestBody Escola dados) {
        return escolaRepository.findById(id).map(escola -> {
            escola.setNome(dados.getNome());
            if (dados.getCnpj() != null) escola.setCnpj(dados.getCnpj());
            if (dados.getAtivo() != null) escola.setAtivo(dados.getAtivo());
            if (dados.getSlug() != null && !dados.getSlug().isBlank()) {
                escola.setSlug(dados.getSlug());
            }
            return ResponseEntity.ok(escolaRepository.save(escola));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MASTER')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!escolaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        escolaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String gerarSlug(String nome) {
        if (nome == null) return "";
        return nome.toLowerCase()
                .replaceAll("[áàâã]", "a")
                .replaceAll("[éèê]", "e")
                .replaceAll("[íìî]", "i")
                .replaceAll("[óòôõ]", "o")
                .replaceAll("[úùû]", "u")
                .replaceAll("[ç]", "c")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
