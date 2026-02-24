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
import java.util.Optional;

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

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(id);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();

        // Atualiza nome se enviado
        if (body.containsKey("nome") && !body.get("nome").isBlank()) {
            usuario.setNome(body.get("nome"));
        }

        // Atualiza login se enviado e não conflita com outro usuário
        if (body.containsKey("login") && !body.get("login").isBlank()) {
            String novoLogin = body.get("login");
            Optional<Usuario> loginExistente = usuarioRepository.findByLogin(novoLogin);
            if (loginExistente.isPresent() && !loginExistente.get().getId().equals(id)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Login já está em uso");
            }
            usuario.setLogin(novoLogin);
        }

        // Atualiza senha se enviada
        if (body.containsKey("senha") && !body.get("senha").isBlank()) {
            usuario.setSenhaHash(passwordEncoder.encode(body.get("senha")));
        }

        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of(
                "id", usuario.getId(),
                "nome", usuario.getNome(),
                "login", usuario.getLogin(),
                "role", usuario.getRole()
        ));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(id);

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();
        usuario.setAtivo(!usuario.getAtivo());
        usuarioRepository.save(usuario);

        String status = usuario.getAtivo() ? "ativado" : "inativado";
        return ResponseEntity.ok(Map.of(
                "id", usuario.getId(),
                "ativo", usuario.getAtivo(),
                "mensagem", "Usuário " + status + " com sucesso"
        ));
    }
}