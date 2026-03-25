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
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.locks.ReentrantLock;

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

    // Scopes para cobrança bancária (do portal Sicoob Developers)
    private static final String COBRANCA_SCOPES =
            "boletos_inclusao boletos_consulta boletos_alteracao";

    // Cache do token para evitar chamadas desnecessárias (token dura 300s / 5min)
    private volatile String cachedAccessToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;
    private final ReentrantLock tokenLock = new ReentrantLock();

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

            // API V3 espera um ARRAY com um objeto boleto
            ObjectNode boletoObj = mapper.createObjectNode();
            boletoObj.put("numeroContrato", config.getNumeroContratoCobranca());
            boletoObj.put("modalidade", config.getModalidade() != null ? config.getModalidade() : 1);
            boletoObj.put("numeroContaCorrente", config.getContaCorrente());
            boletoObj.put("especieDocumento", config.getEspecieDocumento() != null ? config.getEspecieDocumento() : "DM");
            boletoObj.put("dataEmissao", LocalDate.now().format(DATE_FMT));
            boletoObj.putNull("nossoNumero"); // Sicoob gera automaticamente
            boletoObj.put("seuNumero", String.valueOf(cr.getId()));
            boletoObj.putNull("identificacaoBoletoEmpresa");
            boletoObj.put("identificacaoEmissaoBoleto", 1); // 1=Cooperativa emite
            boletoObj.put("identificacaoDistribuicaoBoleto", 1); // 1=Cooperativa distribui
            boletoObj.put("valor", boleto.getValor().doubleValue());
            boletoObj.put("dataVencimento", boleto.getDataVencimento().format(DATE_FMT));
            boletoObj.putNull("dataLimitePagamento");
            boletoObj.putNull("valorAbatimento");
            boletoObj.put("tipoDesconto", 0); // 0=Sem desconto
            boletoObj.putNull("dataPrimeiroDesconto");
            boletoObj.putNull("valorPrimeiroDesconto");
            boletoObj.putNull("dataSegundoDesconto");
            boletoObj.putNull("valorSegundoDesconto");
            boletoObj.putNull("dataTerceiroDesconto");
            boletoObj.putNull("valorTerceiroDesconto");
            boletoObj.put("tipoMulta", 0); // 0=Sem multa
            boletoObj.putNull("dataMulta");
            boletoObj.putNull("valorMulta");
            boletoObj.put("tipoJurosMora", 3); // 3=Isento
            boletoObj.putNull("dataJurosMora");
            boletoObj.putNull("valorJurosMora");
            boletoObj.put("numeroParcela", 1);
            boletoObj.put("aceite", config.getAceite() != null && config.getAceite());
            boletoObj.put("codigoNegativacao", 3); // 3=Não negativar
            boletoObj.putNull("numeroDiasNegativacao");
            boletoObj.put("codigoProtesto", 3); // 3=Não protestar
            boletoObj.putNull("numeroDiasProtesto");
            boletoObj.put("gerarPdf", true);

            // Pagador (objeto nested)
            ObjectNode pagador = mapper.createObjectNode();
            String cpfCnpj = boleto.getPagadorCpfCnpj().replaceAll("[^0-9]", "");
            pagador.put("numeroCpfCnpj", truncar(cpfCnpj, 14));
            pagador.put("nome", truncar(boleto.getPagadorNome(), 50));
            pagador.put("endereco", truncar("Nao informado", 40));
            pagador.put("bairro", truncar("Centro", 30));
            pagador.put("cidade", truncar("Nao informado", 40));
            pagador.put("cep", "00000000");
            pagador.put("uf", "MG");

            // Tentar preencher com dados reais do pagador se disponíveis
            if (cr.getContrato() != null && cr.getContrato().getResponsavelPrincipal() != null) {
                var pessoa = cr.getContrato().getResponsavelPrincipal();
                if (pessoa.getEndereco() != null && !pessoa.getEndereco().isBlank()) {
                    pagador.put("endereco", truncar(pessoa.getEndereco(), 40));
                }
                if (pessoa.getBairro() != null && !pessoa.getBairro().isBlank()) {
                    pagador.put("bairro", truncar(pessoa.getBairro(), 30));
                }
                if (pessoa.getCidade() != null && !pessoa.getCidade().isBlank()) {
                    pagador.put("cidade", truncar(pessoa.getCidade(), 40));
                }
                if (pessoa.getCep() != null && !pessoa.getCep().isBlank()) {
                    String cepLimpo = pessoa.getCep().replaceAll("[^0-9]", "");
                    pagador.put("cep", truncar(cepLimpo, 8));
                }
                if (pessoa.getEstado() != null && !pessoa.getEstado().isBlank()) {
                    pagador.put("uf", pessoa.getEstado());
                }
                if (pessoa.getEmail() != null && !pessoa.getEmail().isBlank()) {
                    // Email é array de strings na V3
                    var emails = mapper.createArrayNode();
                    emails.add(pessoa.getEmail());
                    pagador.set("email", emails);
                }
            }

            boletoObj.set("pagador", pagador);

            // Sacador/Avalista (pode ser null)
            ObjectNode sacador = mapper.createObjectNode();
            sacador.putNull("numeroCpfCnpjSacadorAvalista");
            sacador.putNull("nomeSacadorAvalista");
            boletoObj.set("sacadorAvalista", sacador);

            // Mensagens de instrução
            ObjectNode mensagens = mapper.createObjectNode();
            var msgArray = mapper.createArrayNode();
            msgArray.addNull(); msgArray.addNull(); msgArray.addNull(); msgArray.addNull(); msgArray.addNull();
            mensagens.set("mensagens", msgArray);
            boletoObj.set("mensagensInstrucao", mensagens);

            // Body é um ARRAY
            var bodyArray = mapper.createArrayNode();
            bodyArray.add(boletoObj);

            String bodyJson = mapper.writeValueAsString(bodyArray);
            log.info("Body do boleto V3: {}", bodyJson);

            log.info("Registrando boleto na API Sicoob V3: seuNumero=CR-{}, valor={}", cr.getId(), boleto.getValor());

            RestTemplate rt = buildRestTemplate(config);
            HttpHeaders headers = buildHeaders(config, rt);
            HttpEntity<String> request = new HttpEntity<>(bodyJson, headers);
            ResponseEntity<String> response = rt.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode respBody = mapper.readTree(response.getBody());
                // Resposta V3 pode ser array — pegar primeiro elemento
                JsonNode boletoResp = respBody.isArray() && respBody.size() > 0 ? respBody.get(0) : respBody;
                preencherDadosResposta(boleto, boletoResp);
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

            RestTemplate rt = buildRestTemplate(config);
            HttpHeaders headers = buildHeaders(config, rt);
            HttpEntity<Void> request = new HttpEntity<>(headers);
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

            RestTemplate rt = buildRestTemplate(config);
            HttpHeaders headers = buildHeaders(config, rt);
            HttpEntity<String> request = new HttpEntity<>(mapper.writeValueAsString(body), headers);

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

    /**
     * Obtém um access token válido. Se o token em cache expirou, gera um novo
     * automaticamente via OAuth2 client_credentials com mTLS (certificado digital).
     * Se não tiver certificado (sandbox), usa o token estático da config.
     */
    private String obterAccessToken(FinSicoobConfig config, RestTemplate rt) {
        // Se tem certificado, usa renovação automática via OAuth2
        boolean temCert = (config.getCertConteudo() != null && config.getCertConteudo().length > 0)
                || (config.getCertCaminho() != null && !config.getCertCaminho().isBlank()
                    && Files.exists(Paths.get(config.getCertCaminho())));

        if (!temCert) {
            // Sandbox: usa token estático da config
            return config.getAccessToken();
        }

        // Verifica se o token em cache ainda é válido (com margem de 30s)
        if (cachedAccessToken != null && Instant.now().plusSeconds(30).isBefore(tokenExpiresAt)) {
            return cachedAccessToken;
        }

        // Gera novo token via OAuth2
        tokenLock.lock();
        try {
            // Double-check após adquirir o lock
            if (cachedAccessToken != null && Instant.now().plusSeconds(30).isBefore(tokenExpiresAt)) {
                return cachedAccessToken;
            }

            String tokenUrl = config.getTokenUrl();
            if (tokenUrl == null || tokenUrl.isBlank()) {
                tokenUrl = "https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token";
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String body = "grant_type=client_credentials"
                    + "&client_id=" + config.getClientId()
                    + "&scope=" + COBRANCA_SCOPES.replace(" ", "%20");

            HttpEntity<String> request = new HttpEntity<>(body, headers);

            log.info("Renovando access token via OAuth2: {}", tokenUrl);
            ResponseEntity<String> response = rt.exchange(tokenUrl, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode tokenResp = mapper.readTree(response.getBody());
                cachedAccessToken = tokenResp.get("access_token").asText();
                int expiresIn = tokenResp.has("expires_in") ? tokenResp.get("expires_in").asInt() : 300;
                tokenExpiresAt = Instant.now().plusSeconds(expiresIn);

                log.info("Access token renovado com sucesso (expira em {}s)", expiresIn);

                // Atualiza o token no banco para referência
                config.setAccessToken(cachedAccessToken);
                configService.save(config);

                return cachedAccessToken;
            } else {
                throw new BoletoRegistroException("Resposta inesperada ao gerar token: HTTP " + response.getStatusCode());
            }

        } catch (HttpClientErrorException e) {
            log.error("Erro ao gerar token OAuth2: HTTP {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BoletoRegistroException(
                    "Falha ao gerar access token: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
        } catch (BoletoRegistroException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro inesperado ao gerar token OAuth2", e);
            throw new BoletoRegistroException("Erro ao renovar access token: " + e.getMessage());
        } finally {
            tokenLock.unlock();
        }
    }

    private HttpHeaders buildHeaders(FinSicoobConfig config, RestTemplate rt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Accept", "application/json");
        headers.set("Authorization", "Bearer " + obterAccessToken(config, rt));
        headers.set("client_id", config.getClientId());
        return headers;
    }

    private void validarConfig(FinSicoobConfig config) {
        if (config.getClientId() == null || config.getClientId().isBlank()) {
            throw new BoletoRegistroException("Client ID do Sicoob não configurado.");
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
            // Formato V3: {"mensagens":[{"mensagem":"...", "codigo":"..."}]}
            if (node.has("mensagens") && node.get("mensagens").isArray() && node.get("mensagens").size() > 0) {
                JsonNode primeiro = node.get("mensagens").get(0);
                if (primeiro.isObject() && primeiro.has("mensagem")) {
                    return primeiro.get("mensagem").asText();
                }
                return primeiro.asText();
            }
        } catch (Exception ignored) {}
        return errorBody != null && errorBody.length() > 500 ? errorBody.substring(0, 500) : errorBody;
    }

    private String truncar(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }
}
