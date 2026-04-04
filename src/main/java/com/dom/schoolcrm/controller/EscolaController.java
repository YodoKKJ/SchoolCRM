package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.Escola;
import com.dom.schoolcrm.repository.EscolaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/escolas")
public class EscolaController {

    @Autowired
    private EscolaRepository escolaRepository;

    private static final Path LOGO_DIR = Paths.get("config", "logos");

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECAO') or hasRole('MASTER')")
    public List<Escola> listar() {
        return escolaRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECAO') or hasRole('MASTER')")
    public ResponseEntity<Escola> buscar(@PathVariable Long id) {
        return escolaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECAO') or hasRole('MASTER')")
    public Escola criar(@RequestBody Escola escola) {
        escola.setSlug(gerarSlug(escola.getNome()));
        if (escola.getCorPrimaria() == null || escola.getCorPrimaria().isBlank()) escola.setCorPrimaria("#7ec8a0");
        if (escola.getCorSecundaria() == null || escola.getCorSecundaria().isBlank()) escola.setCorSecundaria("#3a8d5c");
        return escolaRepository.save(escola);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DIRECAO') or hasRole('MASTER')")
    public ResponseEntity<Escola> atualizar(@PathVariable Long id, @RequestBody Escola dados) {
        return escolaRepository.findById(id).map(escola -> {
            escola.setNome(dados.getNome());
            if (dados.getCnpj() != null) escola.setCnpj(dados.getCnpj());
            if (dados.getAtivo() != null) escola.setAtivo(dados.getAtivo());
            if (dados.getSlug() != null && !dados.getSlug().isBlank()) {
                escola.setSlug(dados.getSlug());
            }
            if (dados.getCorPrimaria() != null) escola.setCorPrimaria(dados.getCorPrimaria());
            if (dados.getCorSecundaria() != null) escola.setCorSecundaria(dados.getCorSecundaria());
            return ResponseEntity.ok(escolaRepository.save(escola));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MASTER')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!escolaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        escolaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Upload de logo da escola. Salva o arquivo em config/logos/ e grava o path no banco.
     */
    @PostMapping("/{id}/logo")
    @PreAuthorize("hasRole('MASTER')")
    public ResponseEntity<?> uploadLogo(@PathVariable Long id,
                                        @RequestParam("arquivo") MultipartFile arquivo) {
        Optional<Escola> escolaOpt = escolaRepository.findById(id);
        if (escolaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (arquivo.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Arquivo vazio"));
        }

        String originalName = arquivo.getOriginalFilename();
        if (originalName == null || !originalName.matches("(?i).*\\.(png|jpg|jpeg|gif|svg|webp)$")) {
            return ResponseEntity.badRequest().body(Map.of("erro",
                    "Formato não suportado. Use PNG, JPG, GIF, SVG ou WebP."));
        }

        try {
            Files.createDirectories(LOGO_DIR);

            Escola escola = escolaOpt.get();

            // Remove logo antiga se existir
            if (escola.getLogoUrl() != null) {
                Path oldFile = Paths.get(escola.getLogoUrl());
                Files.deleteIfExists(oldFile);
            }

            String ext = originalName.substring(originalName.lastIndexOf("."));
            String fileName = "logo_" + escola.getSlug() + "_" + System.currentTimeMillis() + ext;
            Path destino = LOGO_DIR.resolve(fileName);
            Files.copy(arquivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

            escola.setLogoUrl(destino.toString().replace("\\", "/"));
            escolaRepository.save(escola);

            return ResponseEntity.ok(Map.of(
                    "logoUrl", escola.getLogoUrl(),
                    "mensagem", "Logo atualizada com sucesso"
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("erro",
                    "Erro ao salvar logo: " + e.getMessage()));
        }
    }

    /**
     * Remove a logo da escola.
     */
    @DeleteMapping("/{id}/logo")
    @PreAuthorize("hasRole('MASTER')")
    public ResponseEntity<?> removerLogo(@PathVariable Long id) {
        Optional<Escola> escolaOpt = escolaRepository.findById(id);
        if (escolaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Escola escola = escolaOpt.get();
        if (escola.getLogoUrl() != null) {
            try {
                Files.deleteIfExists(Paths.get(escola.getLogoUrl()));
            } catch (IOException ignored) {}
            escola.setLogoUrl(null);
            escolaRepository.save(escola);
        }

        return ResponseEntity.ok(Map.of("mensagem", "Logo removida"));
    }

    /**
     * Endpoint público para servir a logo da escola pelo slug.
     * Acessível sem autenticação via /auth/escola/{slug} que já é permitAll.
     * Este endpoint será mapeado em /escolas/logo/{slug} e precisa ser público.
     */
    @GetMapping("/logo/{slug}")
    public ResponseEntity<byte[]> servirLogo(@PathVariable String slug) {
        Optional<Escola> escolaOpt = escolaRepository.findBySlug(slug);
        if (escolaOpt.isEmpty() || escolaOpt.get().getLogoUrl() == null) {
            return ResponseEntity.notFound().build();
        }

        Path logoPath = Paths.get(escolaOpt.get().getLogoUrl());
        if (!Files.exists(logoPath)) {
            return ResponseEntity.notFound().build();
        }

        try {
            byte[] bytes = Files.readAllBytes(logoPath);
            String fileName = logoPath.getFileName().toString().toLowerCase();
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            if (fileName.endsWith(".png")) mediaType = MediaType.IMAGE_PNG;
            else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) mediaType = MediaType.IMAGE_JPEG;
            else if (fileName.endsWith(".gif")) mediaType = MediaType.IMAGE_GIF;
            else if (fileName.endsWith(".svg")) mediaType = MediaType.valueOf("image/svg+xml");
            else if (fileName.endsWith(".webp")) mediaType = MediaType.valueOf("image/webp");

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header("Cache-Control", "public, max-age=86400")
                    .body(bytes);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private String gerarSlug(String nome) {
        if (nome == null) return "";
        return nome.toLowerCase()
                .replaceAll("[áàâã]", "a")
                .replaceAll("[éèê]", "e")
                .replaceAll("[íìî]", "i")
                .replaceAll("[óòôõ]", "o")
                .replaceAll("[úùû]", "u")
                .replaceAll("[ç]", "c")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
