package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import com.dom.schoolcrm.service.RelatorioService;
import com.dom.schoolcrm.service.WhatsappNotificacaoJob;
import com.dom.schoolcrm.service.WhatsappService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Endpoints de configuração e monitoramento do WhatsApp.
 * Todos restritos a DIRECAO.
 */
@RestController
@RequestMapping("/whatsapp")
@PreAuthorize("hasRole('DIRECAO')")
public class WhatsappController {

    private static final Logger log = LoggerFactory.getLogger(WhatsappController.class);

    @Autowired
    private WhatsappService whatsappService;

    @Autowired
    private WhatsappNotificacaoJob notificacaoJob;

    @Autowired
    private WhatsappNotificacaoRepository notificacaoRepository;

    @Autowired
    private AlunoTurmaRepository alunoTurmaRepository;

    @Autowired
    private FinResponsavelAlunoRepository responsavelAlunoRepository;

    @Autowired
    private RelatorioService relatorioService;

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

    // ======================== BOLETINS VIA WHATSAPP ========================

    /**
     * Envia boletins PDF via WhatsApp para todos os alunos de uma turma.
     * Para cada aluno: envia para o telefone do aluno + responsáveis vinculados que tenham telefone.
     * Retorna lista detalhada de resultados.
     */
    @PostMapping("/enviar-boletins")
    public ResponseEntity<?> enviarBoletins(@RequestBody Map<String, Object> body) {
        Long turmaId = ((Number) body.get("turmaId")).longValue();
        int bimestre = body.containsKey("bimestre") ? ((Number) body.get("bimestre")).intValue() : 0;
        String mensagemCustom = (String) body.get("mensagem");

        List<AlunoTurma> vinculos = alunoTurmaRepository.findByTurmaId(turmaId);
        if (vinculos.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("status", "erro", "detalhe", "Nenhum aluno na turma."));
        }

        vinculos.sort(Comparator.comparing(at -> at.getAluno().getNome()));

        List<Map<String, Object>> resultados = new ArrayList<>();
        int enviados = 0;
        int semTelefone = 0;
        int erros = 0;

        for (AlunoTurma at : vinculos) {
            Usuario aluno = at.getAluno();
            String alunoNome = aluno.getNome();

            // Gerar PDF do boletim
            byte[] pdf;
            try {
                pdf = relatorioService.gerarBoletimPDF(aluno.getId(), turmaId);
            } catch (Exception e) {
                log.error("Erro ao gerar boletim de {} (id={}): {}", alunoNome, aluno.getId(), e.getMessage());
                resultados.add(Map.of("aluno", alunoNome, "status", "ERRO", "detalhe", "Erro ao gerar PDF: " + e.getMessage()));
                erros++;
                continue;
            }

            String fileName = "boletim_" + alunoNome.replaceAll("[^a-zA-ZÀ-ú0-9 ]", "").replaceAll("\\s+", "_") + ".pdf";

            // Montar legenda
            String bimestreLabel = bimestre > 0 ? bimestre + "º Bimestre" : "Anual";
            String caption = mensagemCustom != null && !mensagemCustom.isBlank()
                    ? mensagemCustom.replace("{nome}", alunoNome).replace("{bimestre}", bimestreLabel)
                    : "Boletim escolar de *" + alunoNome + "* — " + bimestreLabel;

            // Coletar todos os telefones para enviar (aluno + responsáveis)
            List<String[]> destinatarios = new ArrayList<>(); // [telefone, descricao]

            // Telefone do aluno
            if (aluno.getTelefone() != null && !aluno.getTelefone().isBlank()) {
                destinatarios.add(new String[]{aluno.getTelefone(), "Aluno"});
            }

            // Responsáveis vinculados
            List<FinResponsavelAluno> responsaveis = responsavelAlunoRepository.findByAlunoId(aluno.getId());
            for (FinResponsavelAluno resp : responsaveis) {
                FinPessoa pessoa = resp.getPessoa();
                if (pessoa != null && pessoa.getTelefone() != null && !pessoa.getTelefone().isBlank()) {
                    String desc = "Resp. " + (resp.getParentesco() != null ? resp.getParentesco() : resp.getTipo());
                    destinatarios.add(new String[]{pessoa.getTelefone(), desc});
                }
            }

            if (destinatarios.isEmpty()) {
                resultados.add(Map.of("aluno", alunoNome, "status", "SEM_TELEFONE", "detalhe", "Nenhum telefone cadastrado"));
                semTelefone++;
                continue;
            }

            // Enviar para cada destinatário
            List<String> enviadosPara = new ArrayList<>();
            String ultimoErro = null;
            for (String[] dest : destinatarios) {
                try {
                    whatsappService.enviarPdf(dest[0], pdf, fileName, caption);
                    enviadosPara.add(dest[1] + " (" + dest[0] + ")");
                } catch (Exception e) {
                    ultimoErro = dest[1] + ": " + e.getMessage();
                    log.warn("Erro ao enviar boletim de {} para {}: {}", alunoNome, dest[0], e.getMessage());
                }
            }

            if (!enviadosPara.isEmpty()) {
                resultados.add(Map.of("aluno", alunoNome, "status", "ENVIADO", "detalhe", String.join(", ", enviadosPara)));
                enviados++;
            } else {
                resultados.add(Map.of("aluno", alunoNome, "status", "ERRO", "detalhe", ultimoErro != null ? ultimoErro : "Falha no envio"));
                erros++;
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("total", vinculos.size());
        response.put("enviados", enviados);
        response.put("semTelefone", semTelefone);
        response.put("erros", erros);
        response.put("resultados", resultados);
        return ResponseEntity.ok(response);
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
