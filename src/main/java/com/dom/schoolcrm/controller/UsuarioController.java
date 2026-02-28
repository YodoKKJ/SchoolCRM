package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
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

        String dataNascStr = body.get("dataNascimento");
        if (dataNascStr != null && !dataNascStr.isBlank()) usuario.setDataNascimento(LocalDate.parse(dataNascStr));
        usuario.setNomePai(body.get("nomePai"));
        usuario.setNomeMae(body.get("nomeMae"));

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

    @GetMapping("/buscar")
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR')")
    public ResponseEntity<List<Usuario>> buscar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String role) {
        String nomeParam = (nome == null || nome.isBlank()) ? null : nome.trim();
        String roleParam = (role == null || role.isBlank()) ? null : role.trim();
        return ResponseEntity.ok(usuarioRepository.buscar(nomeParam, roleParam));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var opt = usuarioRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Usuario usuario = opt.get();

        String nome = body.get("nome");
        if (nome != null && !nome.isBlank()) usuario.setNome(nome.trim());

        String login = body.get("login");
        if (login != null && !login.isBlank() && !login.equals(usuario.getLogin())) {
            if (usuarioRepository.findByLogin(login).isPresent())
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Login já existe");
            usuario.setLogin(login.trim());
        }

        String senha = body.get("senha");
        if (senha != null && !senha.isBlank()) {
            usuario.setSenhaHash(passwordEncoder.encode(senha));
        }

        if (body.containsKey("dataNascimento")) {
            String dataNascStr = body.get("dataNascimento");
            usuario.setDataNascimento(dataNascStr == null || dataNascStr.isBlank() ? null : LocalDate.parse(dataNascStr));
        }
        if (body.containsKey("nomePai")) usuario.setNomePai(body.get("nomePai"));
        if (body.containsKey("nomeMae")) usuario.setNomeMae(body.get("nomeMae"));

        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of(
                "id", usuario.getId(),
                "nome", usuario.getNome(),
                "login", usuario.getLogin(),
                "role", usuario.getRole(),
                "ativo", usuario.getAtivo()
        ));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> alterarStatus(@PathVariable Long id) {
        var opt = usuarioRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Usuario usuario = opt.get();
        usuario.setAtivo(!Boolean.TRUE.equals(usuario.getAtivo()));
        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of(
                "id", usuario.getId(),
                "ativo", usuario.getAtivo()
        ));
    }
}