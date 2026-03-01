package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinPessoa;
import com.dom.schoolcrm.entity.FinResponsavelAluno;
import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.FinPessoaRepository;
import com.dom.schoolcrm.repository.FinResponsavelAlunoRepository;
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
 * Vincula responsáveis financeiros (FinPessoa) a alunos (Usuario).
 *
 * GET    /fin/responsaveis/aluno/{alunoId}   → responsáveis do aluno
 * POST   /fin/responsaveis                   → criar vínculo
 * PUT    /fin/responsaveis/{id}              → atualizar parentesco/tipo
 * DELETE /fin/responsaveis/{id}             → remover vínculo
 *
 * Regras de negócio:
 *  - Cada aluno deve ter exatamente 1 responsável PRINCIPAL.
 *  - Ao definir um novo PRINCIPAL, o anterior é rebaixado para SECUNDARIO
 *    (em vez de bloquear — menos fricção operacional).
 *  - Cada aluno pode ter no máximo 2 responsáveis (1 PRINCIPAL + 1 SECUNDARIO).
 */
@RestController
@RequestMapping("/fin/responsaveis")
@PreAuthorize("hasRole('DIRECAO')")
public class FinResponsavelAlunoController {

    @Autowired private FinResponsavelAlunoRepository responsavelRepository;
    @Autowired private FinPessoaRepository pessoaRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    // ─── Listar responsáveis de um aluno ──────────────────────────────────────

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<Map<String, Object>>> listarPorAluno(@PathVariable Long alunoId) {
        List<FinResponsavelAluno> lista = responsavelRepository.findByAlunoId(alunoId);
        return ResponseEntity.ok(lista.stream().map(this::toMap).collect(Collectors.toList()));
    }

    // ─── Vincular responsável a aluno ─────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> vincular(@RequestBody Map<String, Object> body) {
        Long pessoaId = parseLong(body.get("pessoaId"));
        Long alunoId  = parseLong(body.get("alunoId"));
        String tipo   = (String) body.get("tipo");
        String parentesco = (String) body.get("parentesco");

        if (pessoaId == null || alunoId == null || tipo == null) {
            return ResponseEntity.badRequest().body("pessoaId, alunoId e tipo são obrigatórios.");
        }
        if (!tipo.equals("PRINCIPAL") && !tipo.equals("SECUNDARIO")) {
            return ResponseEntity.badRequest().body("tipo deve ser PRINCIPAL ou SECUNDARIO.");
        }

        FinPessoa pessoa = pessoaRepository.findById(pessoaId).orElse(null);
        if (pessoa == null) return ResponseEntity.badRequest().body("Pessoa não encontrada.");

        Usuario aluno = usuarioRepository.findById(alunoId).orElse(null);
        if (aluno == null || !"ALUNO".equals(aluno.getRole())) {
            return ResponseEntity.badRequest().body("Aluno não encontrado.");
        }

        // Impede vínculo duplicado da mesma pessoa com o mesmo aluno
        if (responsavelRepository.existsByPessoaIdAndAlunoId(pessoaId, alunoId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Esta pessoa já é responsável deste aluno.");
        }

        List<FinResponsavelAluno> existentes = responsavelRepository.findByAlunoId(alunoId);

        // Limite de 2 responsáveis por aluno
        if (existentes.size() >= 2) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Aluno já possui 2 responsáveis cadastrados (limite máximo).");
        }

        // Se novo PRINCIPAL, rebaixa o PRINCIPAL atual para SECUNDARIO
        if ("PRINCIPAL".equals(tipo)) {
            responsavelRepository.findByAlunoIdAndTipo(alunoId, "PRINCIPAL").ifPresent(r -> {
                r.setTipo("SECUNDARIO");
                responsavelRepository.save(r);
            });
        }

        // Se novo SECUNDARIO mas já existe um, bloqueia
        if ("SECUNDARIO".equals(tipo) && existentes.stream().anyMatch(r -> "SECUNDARIO".equals(r.getTipo()))) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Aluno já possui um responsável SECUNDARIO. Remova o atual antes de adicionar outro.");
        }

        FinResponsavelAluno vinculo = new FinResponsavelAluno();
        vinculo.setPessoa(pessoa);
        vinculo.setAluno(aluno);
        vinculo.setTipo(tipo);
        vinculo.setParentesco(parentesco);

        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(responsavelRepository.save(vinculo)));
    }

    // ─── Atualizar parentesco ou tipo ─────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        var opt = responsavelRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        FinResponsavelAluno vinculo = opt.get();

        if (body.containsKey("parentesco")) {
            vinculo.setParentesco((String) body.get("parentesco"));
        }
        if (body.containsKey("tipo")) {
            String novoTipo = (String) body.get("tipo");
            if (!novoTipo.equals("PRINCIPAL") && !novoTipo.equals("SECUNDARIO")) {
                return ResponseEntity.badRequest().body("tipo deve ser PRINCIPAL ou SECUNDARIO.");
            }
            // Se promover para PRINCIPAL, rebaixa o atual
            if ("PRINCIPAL".equals(novoTipo)) {
                responsavelRepository.findByAlunoIdAndTipo(vinculo.getAluno().getId(), "PRINCIPAL")
                        .filter(r -> !r.getId().equals(id))
                        .ifPresent(r -> { r.setTipo("SECUNDARIO"); responsavelRepository.save(r); });
            }
            vinculo.setTipo(novoTipo);
        }

        return ResponseEntity.ok(toMap(responsavelRepository.save(vinculo)));
    }

    // ─── Remover vínculo ──────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long id) {
        var opt = responsavelRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        FinResponsavelAluno vinculo = opt.get();

        // Não deixa remover o PRINCIPAL se for o único
        if ("PRINCIPAL".equals(vinculo.getTipo())) {
            long totalAluno = responsavelRepository.findByAlunoId(vinculo.getAluno().getId()).size();
            if (totalAluno == 1) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Não é possível remover o único responsável PRINCIPAL do aluno.");
            }
        }

        responsavelRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Vínculo removido com sucesso."));
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private Map<String, Object> toMap(FinResponsavelAluno r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",          r.getId());
        m.put("tipo",        r.getTipo());
        m.put("parentesco",  r.getParentesco());
        m.put("alunoId",     r.getAluno().getId());
        m.put("alunoNome",   r.getAluno().getNome());
        m.put("pessoaId",    r.getPessoa().getId());
        m.put("pessoaNome",  r.getPessoa().getNome());
        m.put("pessoaCpf",   r.getPessoa().getCpf());
        m.put("pessoaTelefone", r.getPessoa().getTelefone());
        return m;
    }

    private Long parseLong(Object val) {
        if (val == null) return null;
        return ((Number) val).longValue();
    }
}
