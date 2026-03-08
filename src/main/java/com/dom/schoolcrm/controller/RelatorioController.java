package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.service.RelatorioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/relatorios")
public class RelatorioController {

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
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
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
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
