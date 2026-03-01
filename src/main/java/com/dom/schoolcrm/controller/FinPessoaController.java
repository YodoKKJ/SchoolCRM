package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinPessoa;
import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.FinPessoaRepository;
import com.dom.schoolcrm.repository.FinResponsavelAlunoRepository;
import com.dom.schoolcrm.repository.FinFuncionarioRepository;
import com.dom.schoolcrm.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Cadastro unificado de pessoas físicas e jurídicas (CRM Financeiro).
 *
 * POST   /fin/pessoas                     → criar
 * GET    /fin/pessoas                     → listar com filtros
 * GET    /fin/pessoas/{id}                → buscar por id
 * PUT    /fin/pessoas/{id}                → editar
 * PATCH  /fin/pessoas/{id}/status         → ativar/desativar
 * DELETE /fin/pessoas/{id}                → deletar (só se sem vínculos)
 */
@RestController
@RequestMapping("/fin/pessoas")
@PreAuthorize("hasRole('DIRECAO')")
public class FinPessoaController {

    @Autowired private FinPessoaRepository pessoaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private FinResponsavelAlunoRepository responsavelRepository;
    @Autowired private FinFuncionarioRepository funcionarioRepository;

    // ─── Listar com filtros opcionais ──────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cpf,
            @RequestParam(required = false) String cnpj,
            @RequestParam(required = false) String tipoPessoa,
            @RequestParam(required = false) Boolean ativo) {

        String nomeP      = (nome != null && !nome.isBlank()) ? nome.trim() : null;
        String cpfP       = (cpf != null && !cpf.isBlank()) ? cpf.trim() : null;
        String cnpjP      = (cnpj != null && !cnpj.isBlank()) ? cnpj.trim() : null;
        String tipoP      = (tipoPessoa != null && !tipoPessoa.isBlank()) ? tipoPessoa.trim() : null;

        List<FinPessoa> lista = pessoaRepository.buscar(nomeP, cpfP, cnpjP, tipoP, ativo);
        return ResponseEntity.ok(lista.stream().map(this::toMap).collect(Collectors.toList()));
    }

    // ─── Buscar por ID ─────────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return pessoaRepository.findById(id)
                .map(p -> ResponseEntity.ok(toMap(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Criar ────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {
        String tipo = (String) body.get("tipoPessoa");
        if (tipo == null || (!tipo.equals("FISICA") && !tipo.equals("JURIDICA"))) {
            return ResponseEntity.badRequest().body("tipoPessoa deve ser FISICA ou JURIDICA.");
        }

        String nome = (String) body.get("nome");
        if (nome == null || nome.isBlank()) {
            return ResponseEntity.badRequest().body("nome é obrigatório.");
        }

        // Validação CPF/CNPJ único
        ResponseEntity<?> validacao = validarDocumento(body, null);
        if (validacao != null) return validacao;

        FinPessoa pessoa = new FinPessoa();
        preencherCampos(pessoa, body);

        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(pessoaRepository.save(pessoa)));
    }

    // ─── Editar ───────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        var opt = pessoaRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        ResponseEntity<?> validacao = validarDocumento(body, id);
        if (validacao != null) return validacao;

        FinPessoa pessoa = opt.get();
        preencherCampos(pessoa, body);

        return ResponseEntity.ok(toMap(pessoaRepository.save(pessoa)));
    }

    // ─── Toggle ativo ─────────────────────────────────────────────────────────

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> alterarStatus(@PathVariable Long id) {
        var opt = pessoaRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        FinPessoa pessoa = opt.get();
        pessoa.setAtivo(!Boolean.TRUE.equals(pessoa.getAtivo()));
        pessoaRepository.save(pessoa);

        return ResponseEntity.ok(Map.of("id", pessoa.getId(), "ativo", pessoa.getAtivo()));
    }

    // ─── Deletar ──────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        if (!pessoaRepository.existsById(id)) return ResponseEntity.notFound().build();

        boolean temVinculos =
                responsavelRepository.existsByPessoaId(id) ||
                funcionarioRepository.findByPessoaId(id).isPresent();

        if (temVinculos) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Pessoa possui vínculos (responsável ou funcionário) e não pode ser excluída. Desative-a.");
        }

        pessoaRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Pessoa removida com sucesso."));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void preencherCampos(FinPessoa pessoa, Map<String, Object> body) {
        if (body.containsKey("tipoPessoa")) pessoa.setTipoPessoa((String) body.get("tipoPessoa"));
        if (body.containsKey("nome"))       pessoa.setNome(((String) body.get("nome")).trim());
        if (body.containsKey("cpf"))        pessoa.setCpf(limpar((String) body.get("cpf")));
        if (body.containsKey("cnpj"))       pessoa.setCnpj(limpar((String) body.get("cnpj")));
        if (body.containsKey("email"))      pessoa.setEmail(limpar((String) body.get("email")));
        if (body.containsKey("telefone"))   pessoa.setTelefone(limpar((String) body.get("telefone")));
        if (body.containsKey("endereco"))   pessoa.setEndereco(limpar((String) body.get("endereco")));
        if (body.containsKey("cep"))        pessoa.setCep(limpar((String) body.get("cep")));
        if (body.containsKey("cidade"))     pessoa.setCidade(limpar((String) body.get("cidade")));
        if (body.containsKey("estado"))     pessoa.setEstado(limpar((String) body.get("estado")));
        if (body.containsKey("observacoes")) pessoa.setObservacoes((String) body.get("observacoes"));

        // Vínculo opcional com usuario de sistema
        if (body.containsKey("usuarioId")) {
            Object usuarioIdRaw = body.get("usuarioId");
            if (usuarioIdRaw == null) {
                pessoa.setUsuario(null);
            } else {
                Long usuarioId = ((Number) usuarioIdRaw).longValue();
                Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
                pessoa.setUsuario(usuario);
            }
        }
    }

    private ResponseEntity<?> validarDocumento(Map<String, Object> body, Long idAtual) {
        String cpf  = limpar((String) body.get("cpf"));
        String cnpj = limpar((String) body.get("cnpj"));

        if (cpf != null && !cpf.isBlank()) {
            boolean conflito = idAtual == null
                    ? pessoaRepository.findByCpf(cpf).isPresent()
                    : pessoaRepository.existsByCpfAndIdNot(cpf, idAtual);
            if (conflito) return ResponseEntity.status(HttpStatus.CONFLICT).body("CPF já cadastrado.");
        }

        if (cnpj != null && !cnpj.isBlank()) {
            boolean conflito = idAtual == null
                    ? pessoaRepository.findByCnpj(cnpj).isPresent()
                    : pessoaRepository.existsByCnpjAndIdNot(cnpj, idAtual);
            if (conflito) return ResponseEntity.status(HttpStatus.CONFLICT).body("CNPJ já cadastrado.");
        }

        return null; // sem conflito
    }

    private String limpar(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }

    private Map<String, Object> toMap(FinPessoa p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          p.getId());
        m.put("tipoPessoa",  p.getTipoPessoa());
        m.put("nome",        p.getNome());
        m.put("cpf",         p.getCpf());
        m.put("cnpj",        p.getCnpj());
        m.put("email",       p.getEmail());
        m.put("telefone",    p.getTelefone());
        m.put("endereco",    p.getEndereco());
        m.put("cep",         p.getCep());
        m.put("cidade",      p.getCidade());
        m.put("estado",      p.getEstado());
        m.put("observacoes", p.getObservacoes());
        m.put("ativo",       p.getAtivo());
        m.put("createdAt",   p.getCreatedAt());

        if (p.getUsuario() != null) {
            m.put("usuarioId",    p.getUsuario().getId());
            m.put("usuarioNome",  p.getUsuario().getNome());
            m.put("usuarioLogin", p.getUsuario().getLogin());
            m.put("usuarioRole",  p.getUsuario().getRole());
        } else {
            m.put("usuarioId", null);
        }

        return m;
    }
}
