package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.service.RelatorioService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/relatorios")
public class RelatorioController {

    private static final Logger log = LoggerFactory.getLogger(RelatorioController.class);

    @Autowired
    private RelatorioService relatorioService;

    @GetMapping("/boletim/{alunoId}/{turmaId}")
    @PreAuthorize("hasAnyRole('PROFESSOR', 'DIRECAO')")
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
    @PreAuthorize("hasRole('DIRECAO')")
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
    @PreAuthorize("hasRole('DIRECAO')")
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
