package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Comunicado;
import com.dom.schoolcrm.repository.ComunicadoRepository;
import com.dom.schoolcrm.repository.UsuarioRepository;
import com.dom.schoolcrm.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/comunicados")
public class ComunicadoController {

    @Autowired
    private ComunicadoRepository comunicadoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AuditService auditService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> criar(@RequestBody Map<String, String> body, Authentication auth) {
        String titulo = body.get("titulo");
        String corpo = body.get("corpo");
        String destinatarios = body.get("destinatarios");

        if (titulo == null || titulo.isBlank())
            return ResponseEntity.badRequest().body("titulo é obrigatório.");
        if (destinatarios == null || destinatarios.isBlank())
            return ResponseEntity.badRequest().body("destinatarios é obrigatório.");
        if (!List.of("TODOS", "PROFESSORES", "ALUNOS").contains(destinatarios.toUpperCase()))
            return ResponseEntity.badRequest().body("destinatarios deve ser TODOS, PROFESSORES ou ALUNOS.");

        String login = auth.getName();
        var usuarioOpt = usuarioRepository.findByLogin(login);

        Comunicado comunicado = new Comunicado();
        comunicado.setTitulo(titulo.trim());
        comunicado.setCorpo(corpo);
        comunicado.setDestinatarios(destinatarios.toUpperCase());
        comunicado.setDataPublicacao(LocalDateTime.now());
        comunicado.setAtivo(true);

        if (usuarioOpt.isPresent()) {
            comunicado.setAutorId(usuarioOpt.get().getId());
            comunicado.setAutorNome(usuarioOpt.get().getNome());
            comunicado.setAutorRole(usuarioOpt.get().getRole());
        } else {
            comunicado.setAutorNome(login);
            comunicado.setAutorRole(auth.getAuthorities().stream().findFirst()
                    .map(a -> a.getAuthority().replace("ROLE_", "")).orElse("?"));
        }

        comunicadoRepository.save(comunicado);
        auditService.log(auth, "CRIAR", "COMUNICADO", String.valueOf(comunicado.getId()),
                "Titulo=" + comunicado.getTitulo() + " Destinatarios=" + comunicado.getDestinatarios());

        return ResponseEntity.status(HttpStatus.CREATED).body(comunicado);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO', 'ALUNO')")
    public ResponseEntity<?> listar(Authentication auth) {
        List<Comunicado> todos = comunicadoRepository.findByAtivoTrueOrderByDataPublicacaoDesc();

        String role = auth.getAuthorities().stream().findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", "")).orElse("?");

        List<Comunicado> filtrados;

        if ("DIRECAO".equals(role) || "COORDENACAO".equals(role)) {
            filtrados = todos;
        } else if ("PROFESSOR".equals(role)) {
            filtrados = todos.stream()
                    .filter(c -> "TODOS".equals(c.getDestinatarios()) || "PROFESSORES".equals(c.getDestinatarios()))
                    .collect(Collectors.toList());
        } else if ("ALUNO".equals(role)) {
            filtrados = todos.stream()
                    .filter(c -> "TODOS".equals(c.getDestinatarios()) || "ALUNOS".equals(c.getDestinatarios()))
                    .collect(Collectors.toList());
        } else {
            filtrados = todos.stream()
                    .filter(c -> "TODOS".equals(c.getDestinatarios()))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(filtrados);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> deletar(@PathVariable Long id, Authentication auth) {
        var opt = comunicadoRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Comunicado comunicado = opt.get();
        comunicado.setAtivo(false);
        comunicadoRepository.save(comunicado);
        auditService.log(auth, "EXCLUIR", "COMUNICADO", String.valueOf(id),
                "Soft delete: " + comunicado.getTitulo());

        return ResponseEntity.ok(Map.of("mensagem", "Comunicado desativado com sucesso"));
    }
}
