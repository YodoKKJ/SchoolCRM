package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Escola;
import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.AlunoTurmaRepository;
import com.dom.schoolcrm.repository.EscolaRepository;
import com.dom.schoolcrm.repository.ProfessorTurmaMateriaRepository;
import com.dom.schoolcrm.repository.UsuarioRepository;
import com.dom.schoolcrm.security.TenantContext;
import com.dom.schoolcrm.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AlunoTurmaRepository alunoTurmaRepository;

    @Autowired
    private ProfessorTurmaMateriaRepository professorTurmaMateriaRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EscolaRepository escolaRepository;

    @Autowired
    private AuditService auditService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> cadastrar(@RequestBody Map<String, String> body, Authentication auth) {
        Long escolaId = TenantContext.getEscolaId();
        if (escolaId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Escola não identificada.");
        }

        String login = body.get("login");
        if (login == null || login.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Login é obrigatório.");
        }

        if (usuarioRepository.findByLoginAndEscolaId(login, escolaId).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Login já existe nesta escola");
        }

        String role = body.get("role");
        if (!List.of("ALUNO", "PROFESSOR", "DIRECAO", "COORDENACAO").contains(role)) {
            return ResponseEntity.badRequest().body("Role inválida. Use: ALUNO, PROFESSOR, DIRECAO ou COORDENACAO");
        }

        String senha = body.get("senha");
        if (senha == null || senha.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Senha é obrigatória.");
        }

        String nome = body.get("nome");
        if (nome == null || nome.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Nome é obrigatório.");
        }

        Escola escola = escolaRepository.findById(escolaId).orElse(null);
        if (escola == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Escola não encontrada.");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(nome.trim());
        usuario.setLogin(login);
        usuario.setSenhaHash(passwordEncoder.encode(senha));
        usuario.setRole(role);
        usuario.setAtivo(true);
        usuario.setEscola(escola);

        String dataNascStr = body.get("dataNascimento");
        if (dataNascStr != null && !dataNascStr.isBlank()) usuario.setDataNascimento(LocalDate.parse(dataNascStr));
        usuario.setNomePai(body.get("nomePai"));
        usuario.setNomeMae(body.get("nomeMae"));
        usuario.setTelefone(body.get("telefone"));

        usuarioRepository.save(usuario);
        auditService.log(auth, "CRIAR", "USUARIO", String.valueOf(usuario.getId()),
                "Login=" + usuario.getLogin() + " Role=" + usuario.getRole());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "id", usuario.getId(),
                        "nome", usuario.getNome(),
                        "login", usuario.getLogin(),
                        "role", usuario.getRole()
                ));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<List<Usuario>> listar() {
        Long escolaId = TenantContext.getEscolaId();
        if (escolaId != null) {
            return ResponseEntity.ok(usuarioRepository.findByEscolaId(escolaId));
        }
        return ResponseEntity.ok(usuarioRepository.findAll());
    }

    @GetMapping("/buscar")
    @PreAuthorize("hasAnyRole('DIRECAO', 'PROFESSOR', 'COORDENACAO')")
    public ResponseEntity<List<Usuario>> buscar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String role) {
        Long escolaId = TenantContext.getEscolaId();
        String nomeParam = (nome == null || nome.isBlank()) ? null : nome.trim();
        String roleParam = (role == null || role.isBlank()) ? null : role.trim();
        if (escolaId != null) {
            return ResponseEntity.ok(usuarioRepository.buscar(escolaId, nomeParam, roleParam));
        }
        return ResponseEntity.ok(usuarioRepository.buscar(null, nomeParam, roleParam));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var opt = usuarioRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Usuario usuario = opt.get();

        String nome = body.get("nome");
        if (nome != null && !nome.isBlank()) usuario.setNome(nome.trim());

        String login = body.get("login");
        if (login != null && !login.isBlank() && !login.equals(usuario.getLogin())) {
            Long escolaId = TenantContext.getEscolaId();
            boolean existe = escolaId != null
                    ? usuarioRepository.findByLoginAndEscolaId(login, escolaId).isPresent()
                    : usuarioRepository.findByLogin(login).isPresent();
            if (existe) return ResponseEntity.status(HttpStatus.CONFLICT).body("Login já existe nesta escola");
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
        if (body.containsKey("telefone")) usuario.setTelefone(body.get("telefone"));

        usuarioRepository.save(usuario);

        return ResponseEntity.ok(Map.of(
                "id", usuario.getId(),
                "nome", usuario.getNome(),
                "login", usuario.getLogin(),
                "role", usuario.getRole(),
                "ativo", usuario.getAtivo()
        ));
    }

    @GetMapping("/com-vinculos")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<List<Long>> listarIdsComVinculos() {
        Set<Long> ids = new HashSet<>();
        alunoTurmaRepository.findAll().forEach(at -> ids.add(at.getId().getAlunoId()));
        professorTurmaMateriaRepository.findAll().forEach(ptm -> ids.add(ptm.getId().getProfessorId()));
        return ResponseEntity.ok(new ArrayList<>(ids));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    @Transactional
    public ResponseEntity<?> deletar(@PathVariable Long id, Authentication auth) {
        if (!usuarioRepository.existsById(id)) return ResponseEntity.notFound().build();
        boolean temVinculos = !alunoTurmaRepository.findByAlunoId(id).isEmpty()
                || !professorTurmaMateriaRepository.findByProfessorId(id).isEmpty();
        if (temVinculos) return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("Usuário possui vínculos e não pode ser excluído.");
        auditService.log(auth, "EXCLUIR", "USUARIO", String.valueOf(id), "Usuário removido");
        usuarioRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("mensagem", "Usuário removido com sucesso"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
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