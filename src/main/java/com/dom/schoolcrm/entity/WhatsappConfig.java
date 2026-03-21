package com.dom.schoolcrm.entity;

import jakarta.persistence.*;

/**
 * Configuração singleton da integração WhatsApp (Evolution API).
 * Armazena URL da instância, token, dias de antecedência para lembrete,
 * e templates de mensagem.
 */
@Entity
@Table(name = "whatsapp_config")
public class WhatsappConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Singleton enforcer — só existe um registro
    @Column(name = "singleton_key", unique = true, nullable = false, length = 8)
    private String singletonKey = "default";

    // Ativa/desativa o envio automático de lembretes
    @Column(nullable = false)
    private Boolean ativo = false;

    // URL base da Evolution API (ex: https://evo.meusite.com)
    @Column(name = "api_url", length = 500)
    private String apiUrl;

    // Nome da instância na Evolution API
    @Column(name = "instance_name", length = 100)
    private String instanceName;

    // API Key da instância
    @Column(name = "api_key", length = 500)
    private String apiKey;

    // Dias de antecedência para enviar o primeiro lembrete (ex: 3)
    @Column(name = "dias_antes_primeiro")
    private Integer diasAntesPrimeiro = 3;

    // Dias de antecedência para enviar o segundo lembrete (ex: 1)
    @Column(name = "dias_antes_segundo")
    private Integer diasAntesSegundo = 1;

    // Horário do cron (hora do dia, 0-23)
    @Column(name = "hora_envio")
    private Integer horaEnvio = 8;

    // Template de mensagem — placeholders: {nome}, {valor}, {vencimento}, {descricao}
    @Column(name = "template_mensagem", columnDefinition = "TEXT")
    private String templateMensagem = "Olá {nome}! Lembrete: o boleto *{descricao}* no valor de *R$ {valor}* vence em *{vencimento}*. Evite juros e multa, pague em dia! Qualquer dúvida, entre em contato com a secretaria.";

    // Template para boletos já vencidos — placeholders: {nome}, {valor}, {vencimento}, {descricao}, {diasAtraso}
    @Column(name = "template_vencido", columnDefinition = "TEXT")
    private String templateVencido = "Olá {nome}, identificamos que o boleto *{descricao}* no valor de *R$ {valor}* venceu em *{vencimento}* ({diasAtraso} dias atrás). Por favor, regularize o pagamento para evitar encargos adicionais. Em caso de dúvidas, procure a secretaria.";

    // Enviar notificação de boletos vencidos?
    @Column(name = "notificar_vencidos")
    private Boolean notificarVencidos = false;

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSingletonKey() { return singletonKey; }
    public void setSingletonKey(String singletonKey) { this.singletonKey = singletonKey; }

    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }

    public String getApiUrl() { return apiUrl; }
    public void setApiUrl(String apiUrl) { this.apiUrl = apiUrl; }

    public String getInstanceName() { return instanceName; }
    public void setInstanceName(String instanceName) { this.instanceName = instanceName; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public Integer getDiasAntesPrimeiro() { return diasAntesPrimeiro; }
    public void setDiasAntesPrimeiro(Integer diasAntesPrimeiro) { this.diasAntesPrimeiro = diasAntesPrimeiro; }

    public Integer getDiasAntesSegundo() { return diasAntesSegundo; }
    public void setDiasAntesSegundo(Integer diasAntesSegundo) { this.diasAntesSegundo = diasAntesSegundo; }

    public Integer getHoraEnvio() { return horaEnvio; }
    public void setHoraEnvio(Integer horaEnvio) { this.horaEnvio = horaEnvio; }

    public String getTemplateMensagem() { return templateMensagem; }
    public void setTemplateMensagem(String templateMensagem) { this.templateMensagem = templateMensagem; }

    public String getTemplateVencido() { return templateVencido; }
    public void setTemplateVencido(String templateVencido) { this.templateVencido = templateVencido; }

    public Boolean getNotificarVencidos() { return notificarVencidos; }
    public void setNotificarVencidos(Boolean notificarVencidos) { this.notificarVencidos = notificarVencidos; }
}
