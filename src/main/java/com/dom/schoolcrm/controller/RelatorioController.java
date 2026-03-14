package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.AlunoTurma;
import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.AlunoTurmaRepository;
import com.dom.schoolcrm.repository.UsuarioRepository;
import com.dom.schoolcrm.service.RelatorioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/relatorios")
public class RelatorioController {

    private static final Logger log = LoggerFactory.getLogger(RelatorioController.class);

    @Autowired
    private RelatorioService relatorioService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AlunoTurmaRepository alunoTurmaRepository;

    /** Aluno baixa o próprio boletim — extrai alunoId do JWT e valida vínculo na turma */
    @GetMapping("/boletim/meu/{turmaId}")
    @PreAuthorize("hasRole('ALUNO')")
    public ResponseEntity<byte[]> meuBoletim(
            @PathVariable Long turmaId,
            Authentication auth) {
        String login = auth.getName();
        Usuario usuario = usuarioRepository.findByLogin(login).orElse(null);
        if (usuario == null) {
            return ResponseEntity.badRequest()
                    .body("Usuário não encontrado.".getBytes(StandardCharsets.UTF_8));
        }
        Long alunoId = usuario.getId();
        // Valida que o aluno está vinculado à turma solicitada
        boolean vinculado = alunoTurmaRepository.findByAlunoId(alunoId)
                .stream().anyMatch(v -> turmaId.equals(v.getTurma().getId()));
        if (!vinculado) {
            return ResponseEntity.status(403)
                    .body("Acesso negado: você não está vinculado a esta turma.".getBytes(StandardCharsets.UTF_8));
        }
        try {
            byte[] pdf = relatorioService.gerarBoletimPDF(alunoId, turmaId);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"boletim.pdf\"")
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            log.warn("Meu boletim: aluno ou turma não encontrado — alunoId={} turmaId={}", alunoId, turmaId);
            return ResponseEntity.badRequest()
                    .body(e.getMessage().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Erro ao gerar meu boletim — alunoId={} turmaId={}: {} {}",
                    alunoId, turmaId, e.getClass().getSimpleName(), e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body((e.getClass().getSimpleName() + ": " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }

    @GetMapping("/boletim/{alunoId}/{turmaId}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO', 'COORDENACAO')")
    public ResponseEntity<byte[]> boletim(
            @PathVariable Long alunoId,
            @PathVariable Long turmaId) {
        try {
            byte[] pdf = relatorioService.gerarBoletimPDF(alunoId, turmaId);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"boletim_" + alunoId + ".pdf\"")
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            log.warn("Boletim: aluno ou turma não encontrado — alunoId={} turmaId={}", alunoId, turmaId);
            return ResponseEntity.badRequest()
                    .body(e.getMessage().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Erro ao gerar boletim PDF — alunoId={} turmaId={}: {} {}",
                    alunoId, turmaId, e.getClass().getSimpleName(), e.getMessage(), e);
            String detalhe = e.getClass().getSimpleName() + ": " + e.getMessage();
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(detalhe.getBytes(StandardCharsets.UTF_8));
        }
    }

    @GetMapping("/boletim/turma/{turmaId}/zip")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<byte[]> boletimLote(@PathVariable Long turmaId) {
        try {
            byte[] zip = relatorioService.gerarBoletinsLoteZip(turmaId);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("application/zip"))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"boletins_turma_" + turmaId + ".zip\"")
                    .body(zip);
        } catch (IllegalArgumentException e) {
            log.warn("Boletim lote: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(e.getMessage().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Erro ao gerar boletins em lote — turmaId={}: {} {}",
                    turmaId, e.getClass().getSimpleName(), e.getMessage(), e);
            String detalhe = e.getClass().getSimpleName() + ": " + e.getMessage();
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(detalhe.getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * @param tipo     "medias" | "frequencia" | "situacao"
     * @param bimestre 0 = ano completo, 1–4 = bimestre específico (ignorado para "situacao")
     */
    @GetMapping("/turma/{turmaId}")
    @PreAuthorize("hasAnyRole('DIRECAO', 'COORDENACAO')")
    public ResponseEntity<byte[]> relatorioTurma(
            @PathVariable Long turmaId,
            @RequestParam(defaultValue = "medias") String tipo,
            @RequestParam(defaultValue = "0") Integer bimestre) {
        try {
            byte[] pdf = relatorioService.gerarRelatorioTurmaPDF(turmaId, tipo, bimestre);
            String nomeArquivo = "relatorio_" + tipo + "_turma_" + turmaId + ".pdf";
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + nomeArquivo + "\"")
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            log.warn("Relatório turma: turma não encontrada — turmaId={}", turmaId);
            return ResponseEntity.badRequest()
                    .body(e.getMessage().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Erro ao gerar relatório turma — turmaId={} tipo={} bimestre={}: {} {}",
                    turmaId, tipo, bimestre, e.getClass().getSimpleName(), e.getMessage(), e);
            String detalhe = e.getClass().getSimpleName() + ": " + e.getMessage();
            return ResponseEntity.internalServerError()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(detalhe.getBytes(StandardCharsets.UTF_8));
        }
    }
}
