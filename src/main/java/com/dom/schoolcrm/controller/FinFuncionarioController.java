package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinBeneficio;
import com.dom.schoolcrm.entity.FinFuncionario;
import com.dom.schoolcrm.entity.FinPessoa;
import com.dom.schoolcrm.repository.FinBeneficioRepository;
import com.dom.schoolcrm.repository.FinFuncionarioRepository;
import com.dom.schoolcrm.repository.FinPessoaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gestão de funcionários e seus benefícios/adicionais.
 *
 * Funcionários:
 *   GET    /fin/funcionarios                          → listar
 *   GET    /fin/funcionarios/{id}                     → detalhe com benefícios
 *   POST   /fin/funcionarios                          → cadastrar
 *   PUT    /fin/funcionarios/{id}                     → editar
 *   PATCH  /fin/funcionarios/{id}/status              → ativar/desativar
 *
 * Benefícios (aninhados sob o funcionário):
 *   GET    /fin/funcionarios/{id}/beneficios          → listar benefícios
 *   POST   /fin/funcionarios/{id}/beneficios          → adicionar benefício
 *   PUT    /fin/beneficios/{id}                       → editar benefício
 *   PATCH  /fin/beneficios/{id}/status                → ativar/desativar benefício
 *   DELETE /fin/beneficios/{id}                       → remover benefício
 */
@RestController
@PreAuthorize("hasRole('DIRECAO')")
public class FinFuncionarioController {

    @Autowired private FinFuncionarioRepository funcionarioRepository;
    @Autowired private FinPessoaRepository pessoaRepository;
    @Autowired private FinBeneficioRepository beneficioRepository;

    // ══════════════════════════════════════════════════════════════════════════
    //  FUNCIONÁRIOS
    // ══════════════════════════════════════════════════════════════════════════

    @GetMapping("/fin/funcionarios")
    public ResponseEntity<List<Map<String, Object>>> listar(
            @RequestParam(defaultValue = "false") boolean apenasAtivos) {
        List<FinFuncionario> lista = apenasAtivos
                ? funcionarioRepository.findByAtivoTrueOrderByPessoaNomeAsc()
                : funcionarioRepository.findAllByOrderByPessoaNomeAsc();
        return ResponseEntity.ok(lista.stream().map(f -> toMap(f, false)).collect(Collectors.toList()));
    }

    @GetMapping("/fin/funcionarios/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return funcionarioRepository.findById(id)
                .map(f -> ResponseEntity.ok(toMap(f, true)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/fin/funcionarios")
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {
        Long pessoaId = parseLong(body.get("pessoaId"));
        if (pessoaId == null) return ResponseEntity.badRequest().body("pessoaId é obrigatório.");

        FinPessoa pessoa = pessoaRepository.findById(pessoaId).orElse(null);
        if (pessoa == null) return ResponseEntity.badRequest().body("Pessoa não encontrada.");

        if (funcionarioRepository.findByPessoaId(pessoaId).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Esta pessoa já possui um cadastro de funcionário.");
        }

        String cargo = (String) body.get("cargo");
        if (cargo == null || cargo.isBlank()) return ResponseEntity.badRequest().body("cargo é obrigatório.");

        Object salarioRaw = body.get("salarioBase");
        if (salarioRaw == null) return ResponseEntity.badRequest().body("salarioBase é obrigatório.");

        FinFuncionario func = new FinFuncionario();
        func.setPessoa(pessoa);
        preencherCampos(func, body);

        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(funcionarioRepository.save(func), false));
    }

    @PutMapping("/fin/funcionarios/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        var opt = funcionarioRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        FinFuncionario func = opt.get();
        preencherCampos(func, body);
        return ResponseEntity.ok(toMap(funcionarioRepository.save(func), false));
    }

    @PatchMapping("/fin/funcionarios/{id}/status")
    public ResponseEntity<?> alterarStatus(@PathVariable Long id) {
        var opt = funcionarioRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        FinFuncionario func = opt.get();
        func.setAtivo(!Boolean.TRUE.equals(func.getAtivo()));
        funcionarioRepository.save(func);

        return ResponseEntity.ok(Map.of("id", func.getId(), "ativo", func.getAtivo()));
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  BENEFÍCIOS
    // ══════════════════════════════════════════════════════════════════════════

    @GetMapping("/fin/funcionarios/{id}/beneficios")
    public ResponseEntity<?> listarBeneficios(@PathVariable Long id) {
        if (!funcionarioRepository.existsById(id)) return ResponseEntity.notFound().build();
        List<FinBeneficio> lista = beneficioRepository.findByFuncionarioIdOrderByTipoAsc(id);
        return ResponseEntity.ok(lista.stream().map(this::beneficioToMap).collect(Collectors.toList()));
    }

    @PostMapping("/fin/funcionarios/{id}/beneficios")
    public ResponseEntity<?> adicionarBeneficio(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        FinFuncionario func = funcionarioRepository.findById(id).orElse(null);
        if (func == null) return ResponseEntity.notFound().build();

        String tipo = (String) body.get("tipo");
        if (tipo == null || tipo.isBlank()) return ResponseEntity.badRequest().body("tipo é obrigatório.");

        Object valorRaw = body.get("valor");
        if (valorRaw == null) return ResponseEntity.badRequest().body("valor é obrigatório.");

        FinBeneficio beneficio = new FinBeneficio();
        beneficio.setFuncionario(func);
        beneficio.setTipo(tipo.toUpperCase());
        beneficio.setDescricao((String) body.get("descricao"));
        beneficio.setValor(new BigDecimal(valorRaw.toString()));
        beneficio.setAtivo(true);

        return ResponseEntity.status(HttpStatus.CREATED).body(beneficioToMap(beneficioRepository.save(beneficio)));
    }

    @PutMapping("/fin/beneficios/{id}")
    public ResponseEntity<?> editarBeneficio(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        var opt = beneficioRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        FinBeneficio beneficio = opt.get();
        if (body.containsKey("tipo"))      beneficio.setTipo(((String) body.get("tipo")).toUpperCase());
        if (body.containsKey("descricao")) beneficio.setDescricao((String) body.get("descricao"));
        if (body.containsKey("valor"))     beneficio.setValor(new BigDecimal(body.get("valor").toString()));

        return ResponseEntity.ok(beneficioToMap(beneficioRepository.save(beneficio)));
    }

    @PatchMapping("/fin/beneficios/{id}/status")
    public ResponseEntity<?> alterarStatusBeneficio(@PathVariable Long id) {
        var opt = beneficioRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        FinBeneficio beneficio = opt.get();
        beneficio.setAtivo(!Boolean.TRUE.equals(beneficio.getAtivo()));
        beneficioRepository.save(beneficio);

        return ResponseEntity.ok(Map.of("id", beneficio.getId(), "ativo", beneficio.getAtivo()));
    }

    @DeleteMapping("/fin/beneficios/{id}")
    public ResponseEntity<?> deletarBeneficio(@PathVariable Long id) {
        if (!beneficioRepository.existsById(id)) return ResponseEntity.notFound().build();
        beneficioRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Benefício removido."));
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private void preencherCampos(FinFuncionario func, Map<String, Object> body) {
        if (body.containsKey("cargo"))        func.setCargo((String) body.get("cargo"));
        if (body.containsKey("salarioBase"))  func.setSalarioBase(new BigDecimal(body.get("salarioBase").toString()));
        if (body.containsKey("cargaHoraria")) func.setCargaHoraria(new BigDecimal(body.get("cargaHoraria").toString()));
        if (body.containsKey("dataAdmissao")) {
            String d = (String) body.get("dataAdmissao");
            func.setDataAdmissao(d == null || d.isBlank() ? null : LocalDate.parse(d));
        }
        if (body.containsKey("dataDemissao")) {
            String d = (String) body.get("dataDemissao");
            func.setDataDemissao(d == null || d.isBlank() ? null : LocalDate.parse(d));
        }
    }

    private Map<String, Object> toMap(FinFuncionario f, boolean comBeneficios) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",           f.getId());
        m.put("cargo",        f.getCargo());
        m.put("salarioBase",  f.getSalarioBase());
        m.put("cargaHoraria", f.getCargaHoraria());
        m.put("dataAdmissao", f.getDataAdmissao());
        m.put("dataDemissao", f.getDataDemissao());
        m.put("ativo",        f.getAtivo());

        // Dados resumidos da pessoa
        FinPessoa p = f.getPessoa();
        m.put("pessoaId",        p.getId());
        m.put("pessoaNome",      p.getNome());
        m.put("pessoaTipoPessoa", p.getTipoPessoa());
        m.put("pessoaCpf",       p.getCpf());
        m.put("pessoaCnpj",      p.getCnpj());
        m.put("pessoaTelefone",  p.getTelefone());

        if (comBeneficios) {
            List<FinBeneficio> beneficios = beneficioRepository.findByFuncionarioIdOrderByTipoAsc(f.getId());
            m.put("beneficios", beneficios.stream().map(this::beneficioToMap).collect(Collectors.toList()));

            // Salário total = base + soma dos benefícios ativos
            BigDecimal totalBeneficios = beneficios.stream()
                    .filter(b -> Boolean.TRUE.equals(b.getAtivo()))
                    .map(FinBeneficio::getValor)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            m.put("totalBeneficios", totalBeneficios);
            m.put("salarioTotal", f.getSalarioBase().add(totalBeneficios));
        }

        return m;
    }

    private Map<String, Object> beneficioToMap(FinBeneficio b) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",            b.getId());
        m.put("tipo",          b.getTipo());
        m.put("descricao",     b.getDescricao());
        m.put("valor",         b.getValor());
        m.put("ativo",         b.getAtivo());
        m.put("funcionarioId", b.getFuncionario().getId());
        return m;
    }

    private Long parseLong(Object val) {
        if (val == null) return null;
        return ((Number) val).longValue();
    }
}
