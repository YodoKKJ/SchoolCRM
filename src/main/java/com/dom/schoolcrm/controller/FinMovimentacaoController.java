package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinMovimentacao;
import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.FinFormaPagamentoRepository;
import com.dom.schoolcrm.repository.FinMovimentacaoRepository;
import com.dom.schoolcrm.repository.FinPessoaRepository;
import com.dom.schoolcrm.repository.UsuarioRepository;
import com.dom.schoolcrm.security.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Movimentações avulsas de caixa — registro rápido de entradas e saídas.
 *
 * Pessoa e forma de pagamento são sempre opcionais aqui.
 * Não é necessário ter um cadastro no sistema para registrar uma movimentação.
 *
 * GET    /fin/movimentacoes                        → listar com filtros
 * GET    /fin/movimentacoes/resumo?de=&ate=        → totais de entrada/saída/saldo no período
 * POST   /fin/movimentacoes                        → registrar
 * PUT    /fin/movimentacoes/{id}                   → editar
 * DELETE /fin/movimentacoes/{id}                   → excluir
 */
@RestController
@RequestMapping("/fin/movimentacoes")
@PreAuthorize("hasRole('DIRECAO')")
public class FinMovimentacaoController {

    @Autowired private FinMovimentacaoRepository movimentacaoRepository;
    @Autowired private FinPessoaRepository pessoaRepository;
    @Autowired private FinFormaPagamentoRepository formaPagamentoRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    // ─── Listar com filtros ───────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String de,
            @RequestParam(required = false) String ate) {

        String tipoF = (tipo != null && !tipo.isBlank()) ? tipo.toUpperCase() : null;
        String catF  = (categoria != null && !categoria.isBlank()) ? categoria.trim() : null;
        LocalDate deD  = de  != null ? LocalDate.parse(de)  : null;
        LocalDate ateD = ate != null ? LocalDate.parse(ate) : null;

        Long escolaId = TenantContext.getEscolaId();
        List<FinMovimentacao> lista = movimentacaoRepository.buscar(tipoF, catF, deD, ateD, escolaId);
        return ResponseEntity.ok(lista.stream().map(this::toMap).collect(Collectors.toList()));
    }

    // ─── Resumo do período (entradas / saídas / saldo) ────────────────────────

    @GetMapping("/resumo")
    public ResponseEntity<Map<String, Object>> resumo(
            @RequestParam(required = false) String de,
            @RequestParam(required = false) String ate) {

        // Padrão: mês atual
        LocalDate deD  = de  != null ? LocalDate.parse(de)  : LocalDate.now().withDayOfMonth(1);
        LocalDate ateD = ate != null ? LocalDate.parse(ate) : LocalDate.now();

        Long escolaId = TenantContext.getEscolaId();
        BigDecimal entradas = escolaId != null ? movimentacaoRepository.somarEntradasNoPeriodoByEscola(deD, ateD, escolaId) : movimentacaoRepository.somarEntradasNoPeriodo(deD, ateD);
        BigDecimal saidas   = escolaId != null ? movimentacaoRepository.somarSaidasNoPeriodoByEscola(deD, ateD, escolaId) : movimentacaoRepository.somarSaidasNoPeriodo(deD, ateD);
        BigDecimal saldo    = entradas.subtract(saidas);

        Map<String, Object> resumo = new LinkedHashMap<>();
        resumo.put("de",       deD);
        resumo.put("ate",      ateD);
        resumo.put("entradas", entradas);
        resumo.put("saidas",   saidas);
        resumo.put("saldo",    saldo);

        return ResponseEntity.ok(resumo);
    }

    // ─── Registrar movimentação ───────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {
        String tipo      = str(body.get("tipo"));
        String descricao = str(body.get("descricao"));
        String dataStr   = str(body.get("dataMovimentacao"));

        if (blank(tipo))      return ResponseEntity.badRequest().body("tipo é obrigatório (ENTRADA ou SAIDA).");
        if (!tipo.equalsIgnoreCase("ENTRADA") && !tipo.equalsIgnoreCase("SAIDA")) {
            return ResponseEntity.badRequest().body("tipo deve ser ENTRADA ou SAIDA.");
        }
        if (blank(descricao)) return ResponseEntity.badRequest().body("descricao é obrigatória.");
        if (body.get("valor") == null) return ResponseEntity.badRequest().body("valor é obrigatório.");

        BigDecimal valor = new BigDecimal(body.get("valor").toString());
        if (valor.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body("valor deve ser maior que zero.");
        }

        FinMovimentacao mov = new FinMovimentacao();
        Long escolaId = TenantContext.getEscolaId();
        if (escolaId != null) mov.setEscolaId(escolaId);
        mov.setTipo(tipo.toUpperCase());
        mov.setDescricao(descricao.trim());
        mov.setValor(valor);
        mov.setDataMovimentacao(!blank(dataStr) ? LocalDate.parse(dataStr) : LocalDate.now());
        mov.setCategoria(blank(str(body.get("categoria"))) ? null : str(body.get("categoria")).trim());
        mov.setObservacoes(str(body.get("observacoes")));

        // Pessoa vinculada — totalmente opcional
        Long pessoaId = parseLong(body.get("pessoaId"));
        if (pessoaId != null) pessoaRepository.findById(pessoaId).ifPresent(mov::setPessoa);

        // Forma de pagamento — totalmente opcional
        Long fpId = parseLong(body.get("formaPagamentoId"));
        if (fpId != null) formaPagamentoRepository.findById(fpId).ifPresent(mov::setFormaPagamento);

        // Registra quem criou (via token JWT)
        String loginAtual = SecurityContextHolder.getContext().getAuthentication().getName();
        usuarioRepository.findByLogin(loginAtual).ifPresent(mov::setCreatedBy);

        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(movimentacaoRepository.save(mov)));
    }

    // ─── Editar ───────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        FinMovimentacao mov = movimentacaoRepository.findById(id).orElse(null);
        if (mov == null) return ResponseEntity.notFound().build();

        if (body.containsKey("tipo") && !blank(str(body.get("tipo")))) {
            String novoTipo = str(body.get("tipo")).toUpperCase();
            if (!novoTipo.equals("ENTRADA") && !novoTipo.equals("SAIDA")) {
                return ResponseEntity.badRequest().body("tipo deve ser ENTRADA ou SAIDA.");
            }
            mov.setTipo(novoTipo);
        }
        if (body.containsKey("descricao") && !blank(str(body.get("descricao"))))
            mov.setDescricao(str(body.get("descricao")).trim());
        if (body.containsKey("valor") && body.get("valor") != null) {
            BigDecimal novoValor = new BigDecimal(body.get("valor").toString());
            if (novoValor.compareTo(BigDecimal.ZERO) <= 0)
                return ResponseEntity.badRequest().body("valor deve ser maior que zero.");
            mov.setValor(novoValor);
        }
        if (body.containsKey("dataMovimentacao") && !blank(str(body.get("dataMovimentacao"))))
            mov.setDataMovimentacao(LocalDate.parse(str(body.get("dataMovimentacao"))));
        if (body.containsKey("categoria"))
            mov.setCategoria(blank(str(body.get("categoria"))) ? null : str(body.get("categoria")).trim());
        if (body.containsKey("observacoes"))
            mov.setObservacoes(str(body.get("observacoes")));

        // Atualizar pessoa (null para desvincular)
        if (body.containsKey("pessoaId")) {
            Long pessoaId = parseLong(body.get("pessoaId"));
            mov.setPessoa(pessoaId == null ? null
                    : pessoaRepository.findById(pessoaId).orElse(null));
        }

        // Atualizar forma de pagamento (null para desvincular)
        if (body.containsKey("formaPagamentoId")) {
            Long fpId = parseLong(body.get("formaPagamentoId"));
            mov.setFormaPagamento(fpId == null ? null
                    : formaPagamentoRepository.findById(fpId).orElse(null));
        }

        return ResponseEntity.ok(toMap(movimentacaoRepository.save(mov)));
    }

    // ─── Excluir ──────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        if (!movimentacaoRepository.existsById(id)) return ResponseEntity.notFound().build();
        movimentacaoRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Movimentação removida."));
    }

    // ─── Helper de mapeamento ─────────────────────────────────────────────────

    private Map<String, Object> toMap(FinMovimentacao m) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id",                m.getId());
        r.put("tipo",              m.getTipo());
        r.put("descricao",         m.getDescricao());
        r.put("categoria",         m.getCategoria());
        r.put("valor",             m.getValor());
        r.put("dataMovimentacao",  m.getDataMovimentacao());
        r.put("observacoes",       m.getObservacoes());
        r.put("createdAt",         m.getCreatedAt());

        // Pessoa — pode ser nulo (caixa rápido)
        if (m.getPessoa() != null) {
            r.put("pessoaId",   m.getPessoa().getId());
            r.put("pessoaNome", m.getPessoa().getNome());
        } else {
            r.put("pessoaId",   null);
            r.put("pessoaNome", null);
        }

        // Forma de pagamento — pode ser nula
        if (m.getFormaPagamento() != null) {
            r.put("formaPagamentoId",   m.getFormaPagamento().getId());
            r.put("formaPagamentoNome", m.getFormaPagamento().getNome());
        } else {
            r.put("formaPagamentoId",   null);
            r.put("formaPagamentoNome", null);
        }

        // Quem registrou
        if (m.getCreatedBy() != null) {
            r.put("createdByNome", m.getCreatedBy().getNome());
        }

        return r;
    }

    private String str(Object v) { return v == null ? null : v.toString(); }
    private boolean blank(String s) { return s == null || s.isBlank(); }
    private Long parseLong(Object v) { return v == null ? null : ((Number) v).longValue(); }
}
