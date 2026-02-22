package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Materia;
import com.dom.schoolcrm.repository.MateriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/materias")
public class MateriaController {

    @Autowired
    private MateriaRepository materiaRepository;

    @PostMapping
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> cadastrar(@RequestBody Map<String, String> body) {
        Materia materia = new Materia();
        materia.setNome(body.get("nome"));
        materiaRepository.save(materia);
        return ResponseEntity.status(HttpStatus.CREATED).body(materia);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR')")
    public ResponseEntity<List<Materia>> listar() {
        return ResponseEntity.ok(materiaRepository.findAll());
    }
}