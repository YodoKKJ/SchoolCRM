package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Configurações da integração Sicoob para boletos híbridos.
 * Armazena credenciais, dados do beneficiário e informações do certificado digital.
 * Singleton no banco (garantido por singleton_key unique).
 *
 * Campos sensíveis (clientSecret, webhookSecret, certSenha) são ofuscados no JSON de resposta.
 */
@Entity
@Table(name = "fin_sicoob_config")
public class FinSicoobConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Toggle: habilita integração real com Sicoob (false = usa mock)
    @Column(name = "ativo")
    private boolean ativo = false;

    // Ambiente: SANDBOX ou PRODUCAO
    @Column(name = "ambiente", length = 20)
    private String ambiente = "SANDBOX";

    // URL base da API (V3)
    @Column(name = "base_url", length = 255)
    private String baseUrl = "https://sandbox.sicoob.com.br/sicoob/sandbox/cobranca-bancaria/v3";

    // URL para obter token OAuth2 (produção — sandbox usa token pré-gerado)
    @Column(name = "token_url", length = 500)
    private String tokenUrl = "https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token";

    // Credenciais OAuth2
    @Column(name = "client_id", length = 255)
    private String clientId;

    @Column(name = "client_secret", length = 500)
    private String clientSecret;

    // Access token pré-gerado (sandbox) ou obtido via OAuth2 (produção)
    @Column(name = "access_token", columnDefinition = "TEXT")
    private String accessToken;

    // Número do contrato de cobrança no Sicoob
    @Column(name = "numero_contrato_cobranca", length = 30)
    private String numeroContratoCobranca;

    // Dados do beneficiário (escola)
    @Column(name = "numero_beneficiario", length = 30)
    private String numeroBeneficiario;

    @Column(name = "cooperativa", length = 10)
    private String cooperativa;

    @Column(name = "conta_corrente", length = 20)
    private String contaCorrente;

    // Webhook
    @Column(name = "webhook_secret", length = 255)
    private String webhookSecret;

    // Certificado digital (mTLS)
    @Column(name = "cert_tipo", length = 10)
    private String certTipo; // PFX ou PEM

    @Column(name = "cert_nome_arquivo", length = 255)
    private String certNomeArquivo; // nome original do arquivo uploadado

    @Column(name = "cert_caminho", length = 500)
    private String certCaminho; // caminho no servidor onde o cert foi salvo

    @Column(name = "cert_senha", length = 255)
    private String certSenha; // senha do certificado (PFX)

    @Column(name = "cert_key_caminho", length = 500)
    private String certKeyCaminho; // caminho do .key (quando PEM)

    @Column(name = "cert_validade")
    private LocalDateTime certValidade; // data de expiração do certificado

    // Configurações adicionais do boleto
    @Column(name = "modalidade")
    private Integer modalidade = 1; // 1=Simples com Registro

    @Column(name = "especie_documento", length = 5)
    private String especieDocumento = "DM"; // DM=Duplicata Mercantil

    @Column(name = "aceite")
    private Boolean aceite = false;

    // Controle
    @Column(name = "singleton_key", unique = true, nullable = false, length = 8)
    private String singletonKey = "default";

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public boolean isAtivo() { return ativo; }
    public String getAmbiente() { return ambiente; }
    public String getBaseUrl() { return baseUrl; }
    public String getTokenUrl() { return tokenUrl; }
    public String getClientId() { return clientId; }
    public String getClientSecret() { return clientSecret; }
    public String getAccessToken() { return accessToken; }
    public String getNumeroContratoCobranca() { return numeroContratoCobranca; }
    public String getNumeroBeneficiario() { return numeroBeneficiario; }
    public String getCooperativa() { return cooperativa; }
    public String getContaCorrente() { return contaCorrente; }
    public String getWebhookSecret() { return webhookSecret; }
    public String getCertTipo() { return certTipo; }
    public String getCertNomeArquivo() { return certNomeArquivo; }
    public String getCertCaminho() { return certCaminho; }
    public String getCertSenha() { return certSenha; }
    public String getCertKeyCaminho() { return certKeyCaminho; }
    public LocalDateTime getCertValidade() { return certValidade; }
    public Integer getModalidade() { return modalidade; }
    public String getEspecieDocumento() { return especieDocumento; }
    public Boolean getAceite() { return aceite; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public void setAmbiente(String ambiente) { this.ambiente = ambiente; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public void setTokenUrl(String tokenUrl) { this.tokenUrl = tokenUrl; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public void setNumeroContratoCobranca(String numeroContratoCobranca) { this.numeroContratoCobranca = numeroContratoCobranca; }
    public void setNumeroBeneficiario(String numeroBeneficiario) { this.numeroBeneficiario = numeroBeneficiario; }
    public void setCooperativa(String cooperativa) { this.cooperativa = cooperativa; }
    public void setContaCorrente(String contaCorrente) { this.contaCorrente = contaCorrente; }
    public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }
    public void setCertTipo(String certTipo) { this.certTipo = certTipo; }
    public void setCertNomeArquivo(String certNomeArquivo) { this.certNomeArquivo = certNomeArquivo; }
    public void setCertCaminho(String certCaminho) { this.certCaminho = certCaminho; }
    public void setCertSenha(String certSenha) { this.certSenha = certSenha; }
    public void setCertKeyCaminho(String certKeyCaminho) { this.certKeyCaminho = certKeyCaminho; }
    public void setCertValidade(LocalDateTime certValidade) { this.certValidade = certValidade; }
    public void setModalidade(Integer modalidade) { this.modalidade = modalidade; }
    public void setEspecieDocumento(String especieDocumento) { this.especieDocumento = especieDocumento; }
    public void setAceite(Boolean aceite) { this.aceite = aceite; }
}
