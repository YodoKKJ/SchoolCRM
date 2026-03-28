package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Materia;
import com.dom.schoolcrm.repository.MateriaRepository;
import com.dom.schoolcrm.security.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/materias")
public class MateriaController {

    @Autowired
    private MateriaRepository materiaRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> cadastrar(@RequestBody Map<String, String> body) {
        Long escolaId = TenantContext.getEscolaId();
        Materia materia = new Materia();
        materia.setNome(body.get("nome"));
        if (escolaId != null) materia.setEscolaId(escolaId);
        materiaRepository.save(materia);
        return ResponseEntity.status(HttpStatus.CREATED).body(materia);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR', 'COORDENACAO')")
    public ResponseEntity<List<Materia>> listar() {
        Long escolaId = TenantContext.getEscolaId();
        List<Materia> result = escolaId != null
                ? materiaRepository.findByEscolaId(escolaId)
                : materiaRepository.findAll();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR', 'COORDENACAO')")
    public ResponseEntity<List<Materia>> buscar(@RequestParam(required = false) String nome) {
        Long escolaId = TenantContext.getEscolaId();
        String nomeParam = (nome == null || nome.isBlank()) ? null : nome.trim();
        return ResponseEntity.ok(materiaRepository.buscar(nomeParam, escolaId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> deletarMateria(@PathVariable Long id) {
        if (!materiaRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Matéria não encontrada");
        }
        materiaRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Matéria removida com sucesso"));
    }

}