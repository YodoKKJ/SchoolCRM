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

        return ResponseEntity.ok(Map.of(
                "token", token,
                "role", usuario.getRole(),
                "nome", usuario.getNome(),
                "id", usuario.getId(),
                "escolaSlug", escola.getSlug(),
                "escolaNome", escola.getNome()
        ));
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
        return ResponseEntity.ok(Map.of(
                "id", escola.getId(),
                "nome", escola.getNome(),
                "slug", escola.getSlug()
        ));
    }
}