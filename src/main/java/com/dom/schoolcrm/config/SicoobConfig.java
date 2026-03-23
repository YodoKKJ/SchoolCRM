package com.dom.schoolcrm.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configurações da API Sicoob para emissão de boletos híbridos.
 * Mapeadas de application.properties com prefixo "sicoob.api".
 *
 * Em desenvolvimento: sicoob.api.enabled=false (usa BoletoServiceMock)
 * Em produção/sandbox: sicoob.api.enabled=true (usa SicoobBoletoService)
 */
@Configuration
@ConfigurationProperties(prefix = "sicoob.api")
public class SicoobConfig {

    private boolean enabled = false;

    // URL base da API V3 (sandbox ou produção)
    private String baseUrl = "https://sandbox.sicoob.com.br/sicoob/sandbox/cobranca-bancaria/v3";

    // Credenciais
    private String clientId;
    private String clientSecret;
    private String accessToken;
    private String tokenUrl = "https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token";

    // Dados do beneficiário (escola)
    private String numeroBeneficiario;
    private String numeroContratoCobranca;
    private String cooperativa;
    private String contaCorrente;

    // Webhook
    private String webhookSecret;

    public boolean isEnabled() { return enabled; }
    public String getBaseUrl() { return baseUrl; }
    public String getClientId() { return clientId; }
    public String getClientSecret() { return clientSecret; }
    public String getAccessToken() { return accessToken; }
    public String getTokenUrl() { return tokenUrl; }
    public String getNumeroBeneficiario() { return numeroBeneficiario; }
    public String getNumeroContratoCobranca() { return numeroContratoCobranca; }
    public String getCooperativa() { return cooperativa; }
    public String getContaCorrente() { return contaCorrente; }
    public String getWebhookSecret() { return webhookSecret; }

    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public void setTokenUrl(String tokenUrl) { this.tokenUrl = tokenUrl; }
    public void setNumeroBeneficiario(String numeroBeneficiario) { this.numeroBeneficiario = numeroBeneficiario; }
    public void setNumeroContratoCobranca(String numeroContratoCobranca) { this.numeroContratoCobranca = numeroContratoCobranca; }
    public void setCooperativa(String cooperativa) { this.cooperativa = cooperativa; }
    public void setContaCorrente(String contaCorrente) { this.contaCorrente = contaCorrente; }
    public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }
}
