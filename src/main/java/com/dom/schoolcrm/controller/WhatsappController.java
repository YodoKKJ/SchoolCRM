package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.WhatsappConfig;
import com.dom.schoolcrm.entity.WhatsappNotificacao;
import com.dom.schoolcrm.repository.WhatsappNotificacaoRepository;
import com.dom.schoolcrm.service.WhatsappNotificacaoJob;
import com.dom.schoolcrm.service.WhatsappService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Endpoints de configuração e monitoramento do WhatsApp.
 * Todos restritos a DIRECAO.
 */
@RestController
@RequestMapping("/whatsapp")
@PreAuthorize("hasRole('DIRECAO')")
public class WhatsappController {

    @Autowired
    private WhatsappService whatsappService;

    @Autowired
    private WhatsappNotificacaoJob notificacaoJob;

    @Autowired
    private WhatsappNotificacaoRepository notificacaoRepository;

    // ======================== CONFIG ========================

    @GetMapping("/config")
    public ResponseEntity<WhatsappConfig> getConfig() {
        return ResponseEntity.ok(whatsappService.getConfig());
    }

    @PutMapping("/config")
    public ResponseEntity<?> saveConfig(@RequestBody Map<String, Object> body) {
        WhatsappConfig config = whatsappService.getConfig();

        if (body.containsKey("ativo"))
            config.setAtivo(Boolean.TRUE.equals(body.get("ativo")));
        if (body.containsKey("apiUrl"))
            config.setApiUrl((String) body.get("apiUrl"));
        if (body.containsKey("instanceName"))
            config.setInstanceName((String) body.get("instanceName"));
        if (body.containsKey("apiKey"))
            config.setApiKey((String) body.get("apiKey"));
        if (body.containsKey("diasAntesPrimeiro"))
            config.setDiasAntesPrimeiro(((Number) body.get("diasAntesPrimeiro")).intValue());
        if (body.containsKey("diasAntesSegundo"))
            config.setDiasAntesSegundo(((Number) body.get("diasAntesSegundo")).intValue());
        if (body.containsKey("horaEnvio"))
            config.setHoraEnvio(((Number) body.get("horaEnvio")).intValue());
        if (body.containsKey("templateMensagem"))
            config.setTemplateMensagem((String) body.get("templateMensagem"));
        if (body.containsKey("templateVencido"))
            config.setTemplateVencido((String) body.get("templateVencido"));
        if (body.containsKey("notificarVencidos"))
            config.setNotificarVencidos(Boolean.TRUE.equals(body.get("notificarVencidos")));

        return ResponseEntity.ok(whatsappService.saveConfig(config));
    }

    // ======================== AÇÕES ========================

    /**
     * Testa a conexão com a Evolution API.
     */
    @PostMapping("/testar-conexao")
    public ResponseEntity<?> testarConexao() {
        try {
            String status = whatsappService.testarConexao();
            return ResponseEntity.ok(Map.of("status", "ok", "detalhe", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "erro",
                    "detalhe", e.getMessage() != null ? e.getMessage() : "Erro desconhecido"
            ));
        }
    }

    /**
     * Dispara o job manualmente (sem esperar o cron).
     */
    @PostMapping("/disparar-agora")
    public ResponseEntity<?> dispararAgora() {
        try {
            notificacaoJob.verificarEEnviar();
            return ResponseEntity.ok(Map.of("status", "ok", "mensagem", "Job executado com sucesso"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "erro",
                    "detalhe", e.getMessage() != null ? e.getMessage() : "Erro"
            ));
        }
    }

    /**
     * Envia uma mensagem de teste para um número específico.
     */
    @PostMapping("/enviar-teste")
    public ResponseEntity<?> enviarTeste(@RequestBody Map<String, String> body) {
        String telefone = body.get("telefone");
        String mensagem = body.get("mensagem");
        if (telefone == null || telefone.isBlank())
            return ResponseEntity.badRequest().body("Telefone é obrigatório.");
        if (mensagem == null || mensagem.isBlank())
            mensagem = "Mensagem de teste do SchoolCRM - WhatsApp configurado com sucesso!";

        try {
            whatsappService.enviarMensagemManual(telefone, mensagem);
            return ResponseEntity.ok(Map.of("status", "ok", "mensagem", "Mensagem enviada!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "erro",
                    "detalhe", e.getMessage()
            ));
        }
    }

    // ======================== BOLETINS ========================

    /**
     * Envia boletim PDF via WhatsApp para todos os alunos de uma turma.
     * O PDF é gerado e enviado como documento para o responsável de cada aluno.
     */
    @PostMapping("/boletim/turma/{turmaId}")
    public ResponseEntity<?> enviarBoletinsTurma(
            @PathVariable Long turmaId,
            @RequestParam(defaultValue = "0") Integer bimestre) {
        try {
            Map<String, Object> result = whatsappService.enviarBoletinsTurma(turmaId, bimestre);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "erro",
                    "detalhe", e.getMessage() != null ? e.getMessage() : "Erro ao enviar boletins"
            ));
        }
    }

    // ======================== HISTÓRICO ========================

    /**
     * Lista as últimas notificações enviadas (para o painel admin).
     */
    @GetMapping("/notificacoes")
    public ResponseEntity<List<Map<String, Object>>> listarNotificacoes() {
        List<WhatsappNotificacao> lista = notificacaoRepository.findUltimas();

        // Limita a 100 registros no response
        List<Map<String, Object>> result = lista.stream().limit(100).map(n -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", n.getId());
            m.put("telefone", n.getTelefone());
            m.put("tipo", n.getTipo());
            m.put("status", n.getStatus());
            m.put("erroDetalhe", n.getErroDetalhe());
            m.put("enviadoEm", n.getEnviadoEm());
            m.put("pessoaNome", n.getPessoa() != null ? n.getPessoa().getNome() : null);
            m.put("alunoNome", n.getAluno() != null ? n.getAluno().getNome() : null);
            m.put("crDescricao", n.getContaReceber() != null ? n.getContaReceber().getDescricao() : null);
            m.put("crValor", n.getContaReceber() != null ? n.getContaReceber().getValor() : null);
            m.put("crVencimento", n.getContaReceber() != null ? n.getContaReceber().getDataVencimento() : null);
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    /**
     * Dashboard: contagens de hoje.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime fimDia = LocalDate.now().atTime(23, 59, 59);

        long enviadasHoje = notificacaoRepository.contarEnviadasNoPeriodo(inicioDia, fimDia);

        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        long enviadasMes = notificacaoRepository.contarEnviadasNoPeriodo(inicioMes, fimDia);

        WhatsappConfig config = whatsappService.getConfig();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("enviadasHoje", enviadasHoje);
        result.put("enviadasMes", enviadasMes);
        result.put("ativo", config.getAtivo());

        return ResponseEntity.ok(result);
    }
}
