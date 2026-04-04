package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Escola;
import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.EscolaRepository;
import com.dom.schoolcrm.repository.UsuarioRepository;
import com.dom.schoolcrm.security.JwtUtil;
import com.dom.schoolcrm.security.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EscolaRepository escolaRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String login = body.get("login");
        String senha = body.get("senha");
        String escolaSlug = body.get("escolaSlug");

        // Resolver escola pelo slug
        if (escolaSlug == null || escolaSlug.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Escola não informada");
        }

        Optional<Escola> escolaOpt = escolaRepository.findBySlugAndAtivoTrue(escolaSlug);
        if (escolaOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Escola não encontrada");
        }

        Escola escola = escolaOpt.get();

        // Buscar usuário por login + escola
        Optional<Usuario> usuarioOpt = usuarioRepository.findByLoginAndEscolaId(login, escola.getId());

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();

        if (!usuario.getAtivo()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Usuário inativo. Entre em contato com a direção.");
        }

        if (!passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Senha incorreta");
        }

        boolean lembrar = "true".equalsIgnoreCase(body.get("lembrar"));
        String token = jwtUtil.gerarToken(usuario.getLogin(), usuario.getRole(), escola.getId(), lembrar);

        java.util.Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("token", token);
        resp.put("role", usuario.getRole());
        resp.put("nome", usuario.getNome());
        resp.put("id", usuario.getId());
        resp.put("escolaSlug", escola.getSlug());
        resp.put("escolaNome", escola.getNome());
        resp.put("corPrimaria", escola.getCorPrimaria() != null ? escola.getCorPrimaria() : "#7ec8a0");
        resp.put("corSecundaria", escola.getCorSecundaria() != null ? escola.getCorSecundaria() : "#3a8d5c");
        resp.put("logoUrl", escola.getLogoUrl());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/master-login")
    public ResponseEntity<?> masterLogin(@RequestBody Map<String, String> body) {
        String login = body.get("login");
        String senha = body.get("senha");

        if (login == null || login.isBlank() || senha == null || senha.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Login e senha são obrigatórios");
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findByLoginAndEscolaIsNullAndRole(login, "MASTER");

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Usuário master não encontrado");
        }

        Usuario usuario = usuarioOpt.get();

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Usuário inativo.");
        }

        if (!passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Senha incorreta");
        }

        boolean lembrar = "true".equalsIgnoreCase(body.get("lembrar"));
        String token = jwtUtil.gerarToken(usuario.getLogin(), usuario.getRole(), null, lembrar);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "role", usuario.getRole(),
                "nome", usuario.getNome(),
                "id", usuario.getId()
        ));
    }

    @PostMapping("/master-impersonate")
    @PreAuthorize("hasRole('MASTER')")
    public ResponseEntity<?> masterImpersonate(@RequestBody Map<String, Object> body) {
        Object rawId = body.get("escolaId");
        if (rawId == null) {
            return ResponseEntity.badRequest().body("escolaId é obrigatório");
        }
        Long escolaId = Long.valueOf(rawId.toString());

        var escola = escolaRepository.findById(escolaId);
        if (escola.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Escola não encontrada");
        }
        if (!Boolean.TRUE.equals(escola.get().getAtivo())) {
            return ResponseEntity.badRequest().body("Escola inativa");
        }

        // Pega o login do MASTER autenticado
        String login = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getName();

        // Gera token MASTER com escolaId — JwtFilter reconhece como impersonação
        String token = jwtUtil.gerarToken(login, "MASTER", escolaId, false);

        Escola e = escola.get();
        java.util.Map<String, Object> impResp = new java.util.HashMap<>();
        impResp.put("token", token);
        impResp.put("role", "MASTER");
        impResp.put("escolaSlug", e.getSlug());
        impResp.put("escolaNome", e.getNome());
        impResp.put("corPrimaria", e.getCorPrimaria() != null ? e.getCorPrimaria() : "#7ec8a0");
        impResp.put("corSecundaria", e.getCorSecundaria() != null ? e.getCorSecundaria() : "#3a8d5c");
        impResp.put("logoUrl", e.getLogoUrl());
        return ResponseEntity.ok(impResp);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> me(Authentication auth) {
        String login = auth.getName();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");
        Long escolaId = TenantContext.getEscolaId();
        return ResponseEntity.ok(Map.of("login", login, "role", role, "escolaId", escolaId != null ? escolaId : 0));
    }

    @GetMapping("/escola/{slug}")
    public ResponseEntity<?> getEscolaBySlug(@PathVariable String slug) {
        Optional<Escola> escolaOpt = escolaRepository.findBySlugAndAtivoTrue(slug);
        if (escolaOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Escola não encontrada");
        }
        Escola escola = escolaOpt.get();
        java.util.Map<String, Object> escolaResp = new java.util.HashMap<>();
        escolaResp.put("id", escola.getId());
        escolaResp.put("nome", escola.getNome());
        escolaResp.put("slug", escola.getSlug());
        escolaResp.put("corPrimaria", escola.getCorPrimaria() != null ? escola.getCorPrimaria() : "#7ec8a0");
        escolaResp.put("corSecundaria", escola.getCorSecundaria() != null ? escola.getCorSecundaria() : "#3a8d5c");
        escolaResp.put("logoUrl", escola.getLogoUrl());
        return ResponseEntity.ok(escolaResp);
    }
}