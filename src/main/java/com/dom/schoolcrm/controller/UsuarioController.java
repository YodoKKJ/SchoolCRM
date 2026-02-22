package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> cadastrar(@RequestBody Map<String, String> body) {
        String login = body.get("login");

        if (usuarioRepository.findByLogin(login).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Login já existe");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(body.get("nome"));
        usuario.setLogin(login);
        usuario.setSenhaHash(passwordEncoder.encode(body.get("senha")));
        usuario.setRole(body.get("role"));
        usuario.setAtivo(true);

        usuarioRepository.save(usuario);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "id", usuario.getId(),
                        "nome", usuario.getNome(),
                        "login", usuario.getLogin(),
                        "role", usuario.getRole()
                ));
    }

    @GetMapping
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<List<Usuario>> listar() {
        return ResponseEntity.ok(usuarioRepository.findAll());
    }
}