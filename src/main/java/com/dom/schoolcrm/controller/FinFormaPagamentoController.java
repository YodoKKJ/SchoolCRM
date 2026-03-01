package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinFormaPagamento;
import com.dom.schoolcrm.repository.FinFormaPagamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * CRUD de formas de pagamento (PIX, Dinheiro, Boleto, etc.).
 * GET /fin/formas-pagamento?apenasAtivas=true  → só as ativas (para selects do sistema)
 * GET /fin/formas-pagamento                    → todas (para tela de gestão)
 */
@RestController
@RequestMapping("/fin/formas-pagamento")
@PreAuthorize("hasRole('DIRECAO')")
public class FinFormaPagamentoController {

    @Autowired
    private FinFormaPagamentoRepository repository;

    @GetMapping
    public ResponseEntity<List<FinFormaPagamento>> listar(
            @RequestParam(defaultValue = "false") boolean apenasAtivas) {
        List<FinFormaPagamento> lista = apenasAtivas
                ? repository.findByAtivoTrueOrderByNomeAsc()
                : repository.findAllByOrderByNomeAsc();
        return ResponseEntity.ok(lista);
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, String> body) {
        String nome = body.get("nome");
        if (nome == null || nome.isBlank()) {
            return ResponseEntity.badRequest().body("Nome é obrigatório.");
        }
        if (repository.existsByNomeIgnoreCase(nome.trim())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Forma de pagamento já existe.");
        }

        FinFormaPagamento forma = new FinFormaPagamento();
        forma.setNome(nome.trim());
        forma.setAtivo(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(forma));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        String nome = body.get("nome");
        if (nome == null || nome.isBlank()) {
            return ResponseEntity.badRequest().body("Nome é obrigatório.");
        }

        FinFormaPagamento forma = opt.get();
        // verifica conflito de nome apenas se o nome mudou
        if (!nome.trim().equalsIgnoreCase(forma.getNome())
                && repository.existsByNomeIgnoreCase(nome.trim())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Forma de pagamento já existe.");
        }

        forma.setNome(nome.trim());
        return ResponseEntity.ok(repository.save(forma));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> alterarStatus(@PathVariable Long id) {
        var opt = repository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        FinFormaPagamento forma = opt.get();
        forma.setAtivo(!Boolean.TRUE.equals(forma.getAtivo()));
        repository.save(forma);

        return ResponseEntity.ok(Map.of("id", forma.getId(), "ativo", forma.getAtivo()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Forma de pagamento removida."));
    }
}
