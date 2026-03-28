package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinContaPagarModelo;
import com.dom.schoolcrm.entity.FinPessoa;
import com.dom.schoolcrm.repository.FinContaPagarModeloRepository;
import com.dom.schoolcrm.repository.FinPessoaRepository;
import com.dom.schoolcrm.security.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * CRUD de modelos de contas fixas recorrentes (água, luz, aluguel, etc.).
 * Esses modelos são usados pelo endpoint /gerar-recorrentes de FinContaPagarController.
 *
 * GET    /fin/modelos-cp                  → listar
 * POST   /fin/modelos-cp                  → criar modelo
 * PUT    /fin/modelos-cp/{id}             → editar
 * PATCH  /fin/modelos-cp/{id}/status      → ativar/desativar
 * DELETE /fin/modelos-cp/{id}             → deletar
 */
@RestController
@RequestMapping("/fin/modelos-cp")
@PreAuthorize("hasRole('DIRECAO')")
public class FinContaPagarModeloController {

    @Autowired private FinContaPagarModeloRepository modeloRepository;
    @Autowired private FinPessoaRepository pessoaRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(
            @RequestParam(defaultValue = "false") boolean apenasAtivos) {
        Long escolaId = TenantContext.getEscolaId();
        List<FinContaPagarModelo> lista;
        if (escolaId != null) {
            lista = apenasAtivos
                    ? modeloRepository.findByEscolaIdAndAtivoTrueOrderByDescricaoAsc(escolaId)
                    : modeloRepository.findByEscolaIdOrderByDescricaoAsc(escolaId);
        } else {
            lista = apenasAtivos
                    ? modeloRepository.findByAtivoTrueOrderByDescricaoAsc()
                    : modeloRepository.findAllByOrderByDescricaoAsc();
        }
        return ResponseEntity.ok(lista.stream().map(this::toMap).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {
        ResponseEntity<?> validacao = validar(body);
        if (validacao != null) return validacao;

        FinContaPagarModelo modelo = new FinContaPagarModelo();
        preencher(modelo, body);
        Long escolaId = TenantContext.getEscolaId();
        if (escolaId != null) modelo.setEscolaId(escolaId);
        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(modeloRepository.save(modelo)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        var opt = modeloRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        // Valida os campos que foram enviados: se presente, não pode ser vazio/inválido
        if (body.containsKey("descricao") && (body.get("descricao") == null || body.get("descricao").toString().isBlank()))
            return ResponseEntity.badRequest().body("descricao não pode ser vazia.");
        if (body.containsKey("categoria") && (body.get("categoria") == null || body.get("categoria").toString().isBlank()))
            return ResponseEntity.badRequest().body("categoria não pode ser vazia.");
        if (body.containsKey("valor") && body.get("valor") != null) {
            try {
                if (new java.math.BigDecimal(body.get("valor").toString()).compareTo(java.math.BigDecimal.ZERO) <= 0)
                    return ResponseEntity.badRequest().body("valor deve ser maior que zero.");
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body("valor inválido.");
            }
        }
        if (body.containsKey("diaVencimento") && body.get("diaVencimento") != null) {
            int dia = ((Number) body.get("diaVencimento")).intValue();
            if (dia < 1 || dia > 28)
                return ResponseEntity.badRequest().body("diaVencimento deve ser entre 1 e 28.");
        }

        preencher(opt.get(), body);
        return ResponseEntity.ok(toMap(modeloRepository.save(opt.get())));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> alterarStatus(@PathVariable Long id) {
        var opt = modeloRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        FinContaPagarModelo m = opt.get();
        m.setAtivo(!Boolean.TRUE.equals(m.getAtivo()));
        modeloRepository.save(m);
        return ResponseEntity.ok(Map.of("id", m.getId(), "ativo", m.getAtivo()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        if (!modeloRepository.existsById(id)) return ResponseEntity.notFound().build();
        modeloRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Modelo removido."));
    }

    private ResponseEntity<?> validar(Map<String, Object> body) {
        if (body.get("descricao") == null || body.get("descricao").toString().isBlank())
            return ResponseEntity.badRequest().body("descricao é obrigatória.");
        if (body.get("categoria") == null || body.get("categoria").toString().isBlank())
            return ResponseEntity.badRequest().body("categoria é obrigatória.");
        if (body.get("valor") == null)
            return ResponseEntity.badRequest().body("valor é obrigatório.");
        if (body.get("diaVencimento") == null)
            return ResponseEntity.badRequest().body("diaVencimento é obrigatório.");
        int dia = ((Number) body.get("diaVencimento")).intValue();
        if (dia < 1 || dia > 28)
            return ResponseEntity.badRequest().body("diaVencimento deve ser entre 1 e 28.");
        return null;
    }

    private void preencher(FinContaPagarModelo m, Map<String, Object> body) {
        if (body.containsKey("descricao"))    m.setDescricao(body.get("descricao").toString().trim());
        if (body.containsKey("categoria"))    m.setCategoria(body.get("categoria").toString().toUpperCase());
        if (body.containsKey("valor"))        m.setValor(new BigDecimal(body.get("valor").toString()));
        if (body.containsKey("diaVencimento")) m.setDiaVencimento(((Number) body.get("diaVencimento")).intValue());
        if (body.containsKey("pessoaId")) {
            Object raw = body.get("pessoaId");
            if (raw == null) { m.setPessoa(null); }
            else { pessoaRepository.findById(((Number) raw).longValue()).ifPresent(m::setPessoa); }
        }
    }

    private Map<String, Object> toMap(FinContaPagarModelo m) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id",            m.getId());
        r.put("descricao",     m.getDescricao());
        r.put("categoria",     m.getCategoria());
        r.put("valor",         m.getValor());
        r.put("diaVencimento", m.getDiaVencimento());
        r.put("ativo",         m.getAtivo());
        if (m.getPessoa() != null) {
            r.put("pessoaId",   m.getPessoa().getId());
            r.put("pessoaNome", m.getPessoa().getNome());
        } else {
            r.put("pessoaId", null);
        }
        return r;
    }
}
