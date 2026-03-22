package com.dom.schoolcrm.service;

import com.dom.schoolcrm.entity.*;
import com.dom.schoolcrm.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.Base64;

/**
 * Serviço de integração com a Evolution API para envio de mensagens WhatsApp.
 * Suporta envio de lembretes de boletos a vencer e boletos vencidos.
 */
@Service
public class WhatsappService {

    private static final Logger log = LoggerFactory.getLogger(WhatsappService.class);
    private static final DateTimeFormatter FMT_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Autowired
    private WhatsappConfigRepository configRepository;

    @Autowired
    private WhatsappNotificacaoRepository notificacaoRepository;


    private final RestTemplate restTemplate;

    {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);
        restTemplate = new RestTemplate(factory);
    }

    // ======================== CONFIG (singleton) ========================

    @Cacheable("whatsappConfig")
    public WhatsappConfig getConfig() {
        return configRepository.findAll().stream().findFirst()
                .orElseGet(this::criarDefault);
    }

    @CacheEvict(value = "whatsappConfig", allEntries = true)
    public WhatsappConfig saveConfig(WhatsappConfig config) {
        return configRepository.save(config);
    }

    private WhatsappConfig criarDefault() {
        WhatsappConfig config = new WhatsappConfig();
        return configRepository.save(config);
    }

    // ======================== ENVIO ========================

    /**
     * Envia mensagem de lembrete para o responsável de uma CR.
     * @param cr       conta a receber
     * @param pessoa   responsável (com telefone)
     * @param tipo     LEMBRETE_PRIMEIRO | LEMBRETE_SEGUNDO | VENCIDO | MANUAL
     * @return true se enviou com sucesso
     */
    public boolean enviarLembrete(FinContaReceber cr, FinPessoa pessoa, String tipo) {
        WhatsappConfig config = getConfig();

        if (!Boolean.TRUE.equals(config.getAtivo())) {
            log.debug("WhatsApp desativado, pulando envio para CR #{}", cr.getId());
            return false;
        }

        String telefone = normalizarTelefone(pessoa.getTelefone());
        if (telefone == null) {
            log.warn("Telefone inválido para pessoa #{} ({})", pessoa.getId(), pessoa.getNome());
            salvarNotificacao(cr, pessoa, pessoa.getTelefone(), tipo, null, "ERRO", "Telefone inválido ou ausente");
            return false;
        }

        // Montar mensagem a partir do template
        String mensagem = montarMensagem(config, cr, pessoa, tipo);

        try {
            enviarViaEvolutionApi(config, telefone, mensagem);
            salvarNotificacao(cr, pessoa, telefone, tipo, mensagem, "ENVIADO", null);
            log.info("WhatsApp enviado: CR #{} → {} ({})", cr.getId(), telefone, tipo);
            return true;
        } catch (Exception e) {
            log.error("Erro ao enviar WhatsApp para CR #{}: {}", cr.getId(), e.getMessage());
            salvarNotificacao(cr, pessoa, telefone, tipo, mensagem, "ERRO", e.getMessage());
            return false;
        }
    }

    /**
     * Envia mensagem personalizada (uso manual pelo admin).
     */
    public boolean enviarMensagemManual(String telefone, String mensagem) {
        WhatsappConfig config = getConfig();

        String telNorm = normalizarTelefone(telefone);
        if (telNorm == null) throw new IllegalArgumentException("Telefone inválido: " + telefone);

        log.info("Enviando mensagem manual para {} (normalizado: {})", telefone, telNorm);
        enviarViaEvolutionApi(config, telNorm, mensagem);
        return true;
    }

    /**
     * Envia um PDF via WhatsApp (Evolution API sendMedia com base64).
     * @param telefone  número do destinatário
     * @param pdfBytes  conteúdo do PDF
     * @param fileName  nome do arquivo (ex: "boletim_joao.pdf")
     * @param caption   legenda da mensagem (opcional)
     */
    public void enviarPdf(String telefone, byte[] pdfBytes, String fileName, String caption) {
        WhatsappConfig config = getConfig();
        String telNorm = normalizarTelefone(telefone);
        if (telNorm == null) throw new IllegalArgumentException("Telefone inválido: " + telefone);

        String base64 = Base64.getEncoder().encodeToString(pdfBytes);
        enviarMediaBase64(config, telNorm, base64, fileName, "application/pdf", caption);
    }

    // ======================== EVOLUTION API ========================

    private void enviarMediaBase64(WhatsappConfig config, String telefone,
                                    String base64, String fileName, String mediatype, String caption) {
        String instanceEncoded = URLEncoder.encode(config.getInstanceName(), StandardCharsets.UTF_8);
        String url = config.getApiUrl().replaceAll("/$", "")
                + "/message/sendMedia/" + instanceEncoded;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", config.getApiKey());

        Map<String, Object> mediaMessage = new LinkedHashMap<>();
        mediaMessage.put("mediatype", "document");
        mediaMessage.put("mimetype", mediatype);
        mediaMessage.put("media", "data:" + mediatype + ";base64," + base64);
        mediaMessage.put("fileName", fileName);
        mediaMessage.put("caption", caption != null ? caption : "");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("number", telefone);
        body.put("mediaMessage", mediaMessage);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Evolution API retornou " + response.getStatusCode() + ": " + response.getBody());
            }
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("Evolution API sendMedia erro {} para {}: {}", e.getStatusCode(), telefone, e.getResponseBodyAsString());
            throw new RuntimeException("Evolution API " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
        }
    }

    private void enviarViaEvolutionApi(WhatsappConfig config, String telefone, String mensagem) {
        String instanceEncoded = URLEncoder.encode(config.getInstanceName(), StandardCharsets.UTF_8);
        String url = config.getApiUrl().replaceAll("/$", "")
                + "/message/sendText/" + instanceEncoded;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", config.getApiKey());

        Map<String, Object> body = Map.of(
                "number", telefone,
                "text", mensagem
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Evolution API retornou " + response.getStatusCode() + ": " + response.getBody());
        }
    }

    /**
     * Testa a conexão com a Evolution API verificando o status da instância.
     * @return JSON de status da instância
     */
    public String testarConexao() {
        WhatsappConfig config = getConfig();

        if (config.getApiUrl() == null || config.getInstanceName() == null || config.getApiKey() == null) {
            throw new IllegalStateException("Configuração incompleta. Preencha URL, instância e API Key.");
        }

        String instanceEncoded = URLEncoder.encode(config.getInstanceName(), StandardCharsets.UTF_8);
        String url = config.getApiUrl().replaceAll("/$", "")
                + "/instance/connectionState/" + instanceEncoded;

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", config.getApiKey());

        HttpEntity<?> request = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

        return response.getBody();
    }

    // ======================== HELPERS ========================

    private String montarMensagem(WhatsappConfig config, FinContaReceber cr, FinPessoa pessoa, String tipo) {
        String template;
        if ("VENCIDO".equals(tipo)) {
            template = config.getTemplateVencido() != null ? config.getTemplateVencido() : config.getTemplateMensagem();
        } else {
            template = config.getTemplateMensagem();
        }

        BigDecimal valor = cr.getValor() != null ? cr.getValor() : BigDecimal.ZERO;
        String vencimento = cr.getDataVencimento() != null ? cr.getDataVencimento().format(FMT_BR) : "—";
        long diasAtraso = cr.getDataVencimento() != null
                ? ChronoUnit.DAYS.between(cr.getDataVencimento(), LocalDate.now())
                : 0;

        return template
                .replace("{nome}", pessoa.getNome() != null ? pessoa.getNome() : "Responsável")
                .replace("{valor}", String.format("%.2f", valor))
                .replace("{vencimento}", vencimento)
                .replace("{descricao}", cr.getDescricao() != null ? cr.getDescricao() : "mensalidade")
                .replace("{diasAtraso}", String.valueOf(Math.max(0, diasAtraso)));
    }

    /**
     * Normaliza telefone para formato brasileiro (55DDD9XXXX).
     * Remove caracteres não numéricos, adiciona 55 se necessário.
     * Retorna null se inválido.
     */
    String normalizarTelefone(String telefone) {
        if (telefone == null || telefone.isBlank()) return null;

        String limpo = telefone.replaceAll("[^0-9]", "");

        // Remove zero à esquerda (ex: 04999786910 → 4999786910)
        while (limpo.startsWith("0")) {
            limpo = limpo.substring(1);
        }

        // Muito curto — inválido
        if (limpo.length() < 10) return null;

        // Se começa com 55 e tem 12-13 dígitos, já está no formato internacional
        if (limpo.startsWith("55") && limpo.length() >= 12) {
            return limpo;
        }

        // DDD + número (10-11 dígitos) — adiciona 55
        if (limpo.length() == 10 || limpo.length() == 11) {
            return "55" + limpo;
        }

        return limpo;
    }

    private void salvarNotificacao(FinContaReceber cr, FinPessoa pessoa, String telefone,
                                    String tipo, String mensagem, String status, String erro) {
        WhatsappNotificacao notif = new WhatsappNotificacao();
        notif.setContaReceber(cr);
        notif.setPessoa(pessoa);
        notif.setTelefone(telefone != null ? telefone : "");
        notif.setTipo(tipo);
        notif.setMensagem(mensagem);
        notif.setStatus(status);
        notif.setErroDetalhe(erro);
        notificacaoRepository.save(notif);
    }
}
