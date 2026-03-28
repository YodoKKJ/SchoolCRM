package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinContrato;
import com.dom.schoolcrm.repository.FinContratoRepository;
import com.dom.schoolcrm.security.TenantContext;
import com.dom.schoolcrm.service.FinContratoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/fin/contratos")
@PreAuthorize("hasRole('DIRECAO')")
public class FinContratoController {

    @Autowired private FinContratoRepository contratoRepository;
    @Autowired private FinContratoService contratoService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(
            @RequestParam(required = false) Long alunoId,
            @RequestParam(required = false) Integer anoLetivo) {

        Long escolaId = TenantContext.getEscolaId();
        List<FinContrato> lista;
        if (alunoId != null && anoLetivo != null) {
            lista = contratoRepository.findByAlunoIdAndAnoLetivo(alunoId, anoLetivo)
                    .map(List::of).orElse(List.of());
        } else if (alunoId != null) {
            lista = escolaId != null
                    ? contratoRepository.findByEscolaIdAndAlunoIdOrderByAnoLetivoDesc(escolaId, alunoId)
                    : contratoRepository.findByAlunoIdOrderByAnoLetivoDesc(alunoId);
        } else if (anoLetivo != null) {
            lista = escolaId != null
                    ? contratoRepository.findByEscolaIdAndAnoLetivoOrderByAlunoNomeAsc(escolaId, anoLetivo)
                    : contratoRepository.findByAnoLetivoOrderByAlunoNomeAsc(anoLetivo);
        } else {
            lista = escolaId != null
                    ? contratoRepository.findByEscolaId(escolaId)
                    : contratoRepository.findAll();
        }

        return ResponseEntity.ok(lista.stream()
                .map(c -> contratoService.toMap(c, false))
                .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return contratoRepository.findById(id)
                .map(c -> ResponseEntity.ok(contratoService.toMap(c, true)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {
        return contratoService.criar(body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        return contratoService.cancelar(id);
    }
}
