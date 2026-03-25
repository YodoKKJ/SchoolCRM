package com.dom.schoolcrm.service.boleto;

import com.dom.schoolcrm.entity.FinBoleto;
import com.dom.schoolcrm.entity.FinContaReceber;
import com.dom.schoolcrm.entity.FinSicoobConfig;
import com.dom.schoolcrm.service.FinSicoobConfigService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.io.HttpClientConnectionManager;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactoryBuilder;
import org.apache.hc.core5.ssl.SSLContexts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.SSLContext;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyStore;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Implementação real do BoletoService usando a API REST Cobrança Bancária V3 do Sicoob.
 * Ativa quando sicoob.api.enabled=true em application.properties.
 *
 * Endpoints V3:
 * - POST {baseUrl}/boletos — registrar boleto
 * - GET  {baseUrl}/boletos?nossoNumero={nn}&numeroCliente={nc} — consultar
 * - POST {baseUrl}/boletos/comandos/baixar — solicitar baixa/cancelamento
 */
@Service
@ConditionalOnProperty(name = "sicoob.api.enabled", havingValue = "true")
public class SicoobBoletoService implements BoletoService {

    private static final Logger log = LoggerFactory.getLogger(SicoobBoletoService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Autowired
    private FinSicoobConfigService configService;

    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Cria um RestTemplate com suporte a mTLS usando o certificado .pfx configurado.
     * Tenta carregar do filesystem primeiro; se não existir (Railway redeploy), carrega do banco.
     * Se não houver certificado, retorna RestTemplate padrão (funciona para sandbox).
     */
    private RestTemplate buildRestTemplate(FinSicoobConfig config) {
        // Verifica se tem certificado disponível (filesystem ou banco)
        boolean temCertFs = config.getCertCaminho() != null && !config.getCertCaminho().isBlank()
                && Files.exists(Paths.get(config.getCertCaminho()));
        boolean temCertDb = config.getCertConteudo() != null && config.getCertConteudo().length > 0;

        if (temCertFs || temCertDb) {
            try {
                char[] senha = config.getCertSenha() != null ? config.getCertSenha().toCharArray() : new char[0];

                KeyStore keyStore = KeyStore.getInstance("PKCS12");

                if (temCertFs) {
                    // Carrega do filesystem
                    try (FileInputStream fis = new FileInputStream(config.getCertCaminho())) {
                        keyStore.load(fis, senha);
                    }
                    log.info("Certificado carregado do filesystem: {}", config.getCertCaminho());
                } else {
                    // Carrega do banco de dados (Railway — filesystem efêmero)
                    try (java.io.ByteArrayInputStream bis = new java.io.ByteArrayInputStream(config.getCertConteudo())) {
                        keyStore.load(bis, senha);
                    }
                    log.info("Certificado carregado do banco de dados: {}", config.getCertNomeArquivo());
                }

                SSLContext sslContext = SSLContexts.custom()
                        .loadKeyMaterial(keyStore, senha)
                        .build();

                HttpClientConnectionManager connManager = PoolingHttpClientConnectionManagerBuilder.create()
                        .setSSLSocketFactory(SSLConnectionSocketFactoryBuilder.create()
                                .setSslContext(sslContext)
                                .build())
                        .build();

                CloseableHttpClient httpClient = HttpClients.custom()
                        .setConnectionManager(connManager)
                        .build();

                HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);
                factory.setConnectTimeout(30000);

                log.info("RestTemplate configurado com mTLS (certificado: {})", config.getCertNomeArquivo());
                return new RestTemplate(factory);

            } catch (Exception e) {
                log.error("Erro ao configurar mTLS com certificado {}: {}", config.getCertNomeArquivo(), e.getMessage());
                throw new BoletoRegistroException(
                        "Erro ao carregar certificado digital: " + e.getMessage()
                        + ". Verifique se o arquivo .pfx e a senha estão corretos.");
            }
        }

        // Sem certificado — usa RestTemplate padrão (OK para sandbox)
        log.warn("Nenhum certificado digital configurado — usando conexão sem mTLS (apenas sandbox)");
        return new RestTemplate();
    }

    @Override
    public FinBoleto registrar(FinBoleto boleto, FinContaReceber cr) {
        FinSicoobConfig config = configService.getConfig();
        validarConfig(config);

        try {
            String url = config.getBaseUrl() + "/boletos";

            ObjectNode body = mapper.createObjectNode();
            body.put("numeroCliente", Integer.parseInt(config.getNumeroBeneficiario()));
            body.put("codigoModalidade", config.getModalidade() != null ? config.getModalidade() : 1);
            body.put("numeroContratoCobranca", config.getNumeroContratoCobranca());
            body.put("seuNumero", "CR-" + cr.getId());
            body.put("dataEmissao", LocalDate.now().format(DATE_FMT));
            body.put("dataVencimento", boleto.getDataVencimento().format(DATE_FMT));
            body.put("valorNominal", boleto.getValor().doubleValue());
            body.put("flagAceite", config.getAceite() != null && config.getAceite());

            // Espécie do documento
            ObjectNode especieDoc = mapper.createObjectNode();
            especieDoc.put("codigo", mapEspecieDocumento(config.getEspecieDocumento()));
            body.set("especieDocumento", especieDoc);

            // Pagador
            ObjectNode pagador = mapper.createObjectNode();
            String cpfCnpj = boleto.getPagadorCpfCnpj().replaceAll("[^0-9]", "");
            pagador.put("numeroCpfCnpj", cpfCnpj);
            pagador.put("nome", boleto.getPagadorNome());
            pagador.put("endereco", "Não informado");
            pagador.put("bairro", "Centro");
            pagador.put("cidade", "Não informado");
            pagador.put("cep", "00000000");
            pagador.put("uf", "MG");

            // Tentar preencher com dados reais do pagador se disponíveis
            if (cr.getContrato() != null && cr.getContrato().getResponsavelPrincipal() != null) {
                var pessoa = cr.getContrato().getResponsavelPrincipal();
                if (pessoa.getEndereco() != null && !pessoa.getEndereco().isBlank()) {
                    pagador.put("endereco", pessoa.getEndereco());
                }
                if (pessoa.getCidade() != null && !pessoa.getCidade().isBlank()) {
                    pagador.put("cidade", pessoa.getCidade());
                }
                if (pessoa.getCep() != null && !pessoa.getCep().isBlank()) {
                    pagador.put("cep", pessoa.getCep().replaceAll("[^0-9]", ""));
                }
                if (pessoa.getEstado() != null && !pessoa.getEstado().isBlank()) {
                    pagador.put("uf", pessoa.getEstado());
                }
                if (pessoa.getEmail() != null && !pessoa.getEmail().isBlank()) {
                    pagador.put("email", pessoa.getEmail());
                }
            }

            body.set("pagador", pagador);

            log.info("Registrando boleto na API Sicoob V3: seuNumero=CR-{}, valor={}", cr.getId(), boleto.getValor());

            HttpHeaders headers = buildHeaders(config);
            HttpEntity<String> request = new HttpEntity<>(mapper.writeValueAsString(body), headers);

            RestTemplate rt = buildRestTemplate(config);
            ResponseEntity<String> response = rt.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode respBody = mapper.readTree(response.getBody());
                preencherDadosResposta(boleto, respBody);
                boleto.setDataEmissao(LocalDate.now());
                boleto.setSeuNumero("CR-" + cr.getId());
                boleto.setStatus("EMITIDO");
                log.info("Boleto registrado com sucesso: nossoNumero={}", boleto.getNossoNumero());
            } else {
                throw new BoletoRegistroException(
                        "Resposta inesperada da API Sicoob: HTTP " + response.getStatusCode());
            }

        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Erro ao registrar boleto na API Sicoob: HTTP {} - {}", e.getStatusCode(), errorBody);
            throw new BoletoRegistroException(
                    "API Sicoob retornou erro " + e.getStatusCode().value() + ": " + extrairMensagemErro(errorBody));
        } catch (BoletoRegistroException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro inesperado ao registrar boleto na API Sicoob", e);
            throw new BoletoRegistroException("Erro ao comunicar com API Sicoob: " + e.getMessage());
        }

        return boleto;
    }

    @Override
    public FinBoleto consultar(FinBoleto boleto) {
        FinSicoobConfig config = configService.getConfig();
        validarConfig(config);

        try {
            String url = config.getBaseUrl() + "/boletos?nossoNumero=" + boleto.getNossoNumero()
                    + "&numeroCliente=" + config.getNumeroBeneficiario();

            HttpHeaders headers = buildHeaders(config);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            RestTemplate rt = buildRestTemplate(config);
            ResponseEntity<String> response = rt.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode respBody = mapper.readTree(response.getBody());
                // A resposta pode ser um array ou objeto
                JsonNode boletoNode = respBody.isArray() && respBody.size() > 0 ? respBody.get(0) : respBody;

                if (boletoNode.has("situacaoBoleto")) {
                    String situacao = boletoNode.get("situacaoBoleto").asText();
                    if ("LIQUIDADO".equalsIgnoreCase(situacao) || "PAGO".equalsIgnoreCase(situacao)) {
                        boleto.setStatus("PAGO");
                        if (boletoNode.has("valorPago")) {
                            boleto.setValorPago(new java.math.BigDecimal(boletoNode.get("valorPago").asText()));
                        }
                        if (boletoNode.has("dataLiquidacao")) {
                            boleto.setDataPagamento(LocalDate.parse(boletoNode.get("dataLiquidacao").asText()));
                        }
                    } else if ("BAIXADO".equalsIgnoreCase(situacao)) {
                        boleto.setStatus("CANCELADO");
                    }
                }
                log.info("Consulta boleto nossoNumero={}: status={}", boleto.getNossoNumero(), boleto.getStatus());
            }

        } catch (HttpClientErrorException e) {
            log.error("Erro ao consultar boleto na API Sicoob: HTTP {} - {}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new BoletoRegistroException("Falha ao consultar boleto: " + e.getStatusCode());
        } catch (BoletoRegistroException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro inesperado ao consultar boleto", e);
            throw new BoletoRegistroException("Erro ao consultar boleto: " + e.getMessage());
        }

        return boleto;
    }

    @Override
    public FinBoleto cancelar(FinBoleto boleto) {
        FinSicoobConfig config = configService.getConfig();
        validarConfig(config);

        try {
            String url = config.getBaseUrl() + "/boletos/comandos/baixar";

            ObjectNode body = mapper.createObjectNode();
            body.put("numeroCliente", Integer.parseInt(config.getNumeroBeneficiario()));
            body.put("nossoNumero", Long.parseLong(boleto.getNossoNumero()));
            body.put("seuNumero", boleto.getSeuNumero());

            HttpHeaders headers = buildHeaders(config);
            HttpEntity<String> request = new HttpEntity<>(mapper.writeValueAsString(body), headers);

            RestTemplate rt = buildRestTemplate(config);
            ResponseEntity<String> response = rt.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                boleto.setStatus("CANCELADO");
                log.info("Boleto cancelado com sucesso: nossoNumero={}", boleto.getNossoNumero());
            } else {
                throw new BoletoRegistroException(
                        "Resposta inesperada ao cancelar boleto: HTTP " + response.getStatusCode());
            }

        } catch (HttpClientErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("Erro ao cancelar boleto na API Sicoob: HTTP {} - {}", e.getStatusCode(), errorBody);
            throw new BoletoRegistroException(
                    "Falha ao cancelar boleto: " + e.getStatusCode().value() + " - " + extrairMensagemErro(errorBody));
        } catch (BoletoRegistroException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro inesperado ao cancelar boleto", e);
            throw new BoletoRegistroException("Erro ao cancelar boleto: " + e.getMessage());
        }

        return boleto;
    }

    @Override
    public boolean isAtivo() {
        try {
            FinSicoobConfig config = configService.getConfig();
            return config.isAtivo()
                    && config.getClientId() != null && !config.getClientId().isBlank()
                    && config.getAccessToken() != null && !config.getAccessToken().isBlank()
                    && config.getNumeroBeneficiario() != null && !config.getNumeroBeneficiario().isBlank();
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getProvedor() {
        return "SICOOB";
    }

    // ---- Helpers ----

    private HttpHeaders buildHeaders(FinSicoobConfig config) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json");
        headers.set("Authorization", "Bearer " + config.getAccessToken());
        headers.set("client_id", config.getClientId());
        return headers;
    }

    private void validarConfig(FinSicoobConfig config) {
        if (config.getClientId() == null || config.getClientId().isBlank()) {
            throw new BoletoRegistroException("Client ID do Sicoob não configurado.");
        }
        if (config.getAccessToken() == null || config.getAccessToken().isBlank()) {
            throw new BoletoRegistroException("Access Token do Sicoob não configurado.");
        }
        if (config.getNumeroBeneficiario() == null || config.getNumeroBeneficiario().isBlank()) {
            throw new BoletoRegistroException("Número do beneficiário não configurado.");
        }
        if (config.getBaseUrl() == null || config.getBaseUrl().isBlank()) {
            throw new BoletoRegistroException("URL base da API Sicoob não configurada.");
        }
    }

    private void preencherDadosResposta(FinBoleto boleto, JsonNode resp) {
        if (resp.has("nossoNumero")) {
            boleto.setNossoNumero(resp.get("nossoNumero").asText());
        }
        if (resp.has("linhaDigitavel")) {
            boleto.setLinhaDigitavel(resp.get("linhaDigitavel").asText());
        }
        if (resp.has("codigoBarras")) {
            boleto.setCodigoBarras(resp.get("codigoBarras").asText());
        }
        // PIX — boleto híbrido retorna dados PIX
        if (resp.has("qrCode")) {
            boleto.setPixCopiaCola(resp.get("qrCode").asText());
        }
        if (resp.has("pix") && resp.get("pix").has("qrCode")) {
            boleto.setPixCopiaCola(resp.get("pix").get("qrCode").asText());
        }
        if (resp.has("pix") && resp.get("pix").has("url")) {
            boleto.setPixUrl(resp.get("pix").get("url").asText());
        }
        // ID do boleto no Sicoob
        if (resp.has("identificacaoBoleto")) {
            boleto.setSicoobId(resp.get("identificacaoBoleto").asText());
        } else if (resp.has("nossoNumero")) {
            boleto.setSicoobId(resp.get("nossoNumero").asText());
        }
    }

    private String extrairMensagemErro(String errorBody) {
        try {
            JsonNode node = mapper.readTree(errorBody);
            if (node.has("mensagem")) return node.get("mensagem").asText();
            if (node.has("message")) return node.get("message").asText();
            if (node.has("detail")) return node.get("detail").asText();
            if (node.has("mensagens") && node.get("mensagens").isArray() && node.get("mensagens").size() > 0) {
                return node.get("mensagens").get(0).asText();
            }
        } catch (Exception ignored) {}
        return errorBody != null && errorBody.length() > 200 ? errorBody.substring(0, 200) : errorBody;
    }

    private int mapEspecieDocumento(String especie) {
        if (especie == null) return 2; // DM
        switch (especie.toUpperCase()) {
            case "CH": return 1;
            case "DM": return 2;
            case "DMI": return 3;
            case "DS": return 4;
            case "DSI": return 5;
            case "DR": return 6;
            case "LC": return 7;
            case "NCC": return 8;
            case "NCE": return 9;
            case "NCI": return 10;
            case "NCR": return 11;
            case "NP": return 12;
            case "NPR": return 13;
            case "TM": return 14;
            case "TS": return 15;
            case "NS": return 16;
            case "RC": return 17;
            case "FAT": return 18;
            case "ND": return 19;
            case "AP": return 20;
            case "ME": return 21;
            case "PC": return 22;
            case "NF": return 23;
            case "DD": return 24;
            case "CPR": return 25;
            default: return 2;
        }
    }
}
