package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.UsuarioRepository;
import com.dom.schoolcrm.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String login = body.get("login");
        String senha = body.get("senha");

        Optional<Usuario> usuarioOpt = usuarioRepository.findByLogin(login);

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
        String token = jwtUtil.gerarToken(usuario.getLogin(), usuario.getRole(), lembrar);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "role", usuario.getRole(),
                "nome", usuario.getNome()
        ));

    }
    @GetMapping("/gerar-hash")
    public String gerarHash() {
        return passwordEncoder.encode("123456");

    }
    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String login = jwtUtil.extrairLogin(token);
        String role = jwtUtil.extrairRole(token);
        return ResponseEntity.ok(Map.of("login", login, "role", role));
    }
}