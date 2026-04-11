package com.dom.schoolcrm.service.boleto;

import com.dom.schoolcrm.entity.FinBoleto;
import com.dom.schoolcrm.entity.FinConvenio;
import com.dom.schoolcrm.entity.FinContaReceber;
import com.dom.schoolcrm.entity.FinPessoa;
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

        // Busca convênio ativo — se não houver, usa defaults do config (retrocompatibilidade)
        FinConvenio convenio = configService.getConvenioAtivo();
        String bodyJson = null;

        try {
            String url = config.getBaseUrl() + "/boletos";

            // Dados do convênio (ou fallback para config legado)
            String numContrato = convenio != null && convenio.getNumeroContrato() != null
                    ? convenio.getNumeroContrato() : config.getNumeroContratoCobranca();
            int modalidade = convenio != null && convenio.getModalidade() != null
                    ? convenio.getModalidade() : (config.getModalidade() != null ? config.getModalidade() : 1);
            String especieDoc = convenio != null && convenio.getEspecieDocumento() != null
                    ? convenio.getEspecieDocumento() : (config.getEspecieDocumento() != null ? config.getEspecieDocumento() : "DM");
            boolean aceite = convenio != null && convenio.getAceite() != null
                    ? convenio.getAceite() : (config.getAceite() != null && config.getAceite());

            // Juros, multa e desconto do convênio
            java.math.BigDecimal pctJuros = convenio != null ? convenio.getPercentualJuros() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal pctMulta = convenio != null ? convenio.getPercentualMulta() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal pctDesconto = convenio != null ? convenio.getPercentualDesconto() : java.math.BigDecimal.ZERO;

            boolean nossoNumeroPeloBanco = convenio == null || convenio.getNossoNumeroPeloBanco() == null
                    || convenio.getNossoNumeroPeloBanco();

            ObjectNode boletoObj = mapper.createObjectNode();
            boletoObj.put("numeroCliente", parseLong(config.getNumeroBeneficiario()));
            boletoObj.put("codigoModalidade", modalidade);
            boletoObj.put("codigoSacadorAvalista", 0);
            boletoObj.put("especieDocumento", especieDoc);
            boletoObj.put("dataEmissao", LocalDate.now().format(DATE_FMT));

            // Nosso número: gerado pelo banco ou pelo sistema
            if (!nossoNumeroPeloBanco && convenio != null && convenio.getNossoNumeroAtual() != null) {
                long proximo = convenio.getNossoNumeroAtual() + 1;
                boletoObj.put("nossoNumero", proximo);
                convenio.setNossoNumeroAtual(proximo);
                configService.salvarConvenio(convenio);
            }

            boletoObj.put("seuNumero", String.valueOf(cr.getId()));
            boletoObj.put("identificacaoEmissaoBoleto", 1); // 1=Cooperativa emite
            boletoObj.put("identificacaoDistribuicaoBoleto", 1); // 1=Cooperativa distribui
            boletoObj.put("valor", boleto.getValor().doubleValue());
            boletoObj.put("dataVencimento", boleto.getDataVencimento().format(DATE_FMT));

            // Desconto
            if (pctDesconto != null && pctDesconto.compareTo(java.math.BigDecimal.ZERO) > 0) {
                boletoObj.put("tipoDesconto", 2); // 2=Percentual até data informada
                boletoObj.put("dataPrimeiroDesconto", boleto.getDataVencimento().format(DATE_FMT));
                boletoObj.put("valorPrimeiroDesconto", pctDesconto.doubleValue());
            } else {
                boletoObj.put("tipoDesconto", 0);
            }

            // Multa
            if (pctMulta != null && pctMulta.compareTo(java.math.BigDecimal.ZERO) > 0) {
                boletoObj.put("tipoMulta", 2); // 2=Percentual
                boletoObj.put("dataMulta", boleto.getDataVencimento().plusDays(1).format(DATE_FMT));
                boletoObj.put("valorMulta", pctMulta.doubleValue());
            } else {
                boletoObj.put("tipoMulta", 0);
            }

            // Juros mora
            if (pctJuros != null && pctJuros.compareTo(java.math.BigDecimal.ZERO) > 0) {
                boletoObj.put("tipoJurosMora", 2); // 2=Percentual ao mês
                boletoObj.put("dataJurosMora", boleto.getDataVencimento().plusDays(1).format(DATE_FMT));
                boletoObj.put("valorJurosMora", pctJuros.doubleValue());
            } else {
                boletoObj.put("tipoJurosMora", 3); // 3=Isento
            }

            boletoObj.put("numeroParcela", cr.getNumParcela() != null ? cr.getNumParcela() : 1);
            boletoObj.put("aceite", aceite);
            boletoObj.put("codigoNegativacao", 3); // 3=Não negativar
            boletoObj.put("numeroDiasNegativacao", 0);
            boletoObj.put("codigoProtesto", 3); // 3=Não protestar
            boletoObj.put("numeroDiasProtesto", 0);

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
            FinPessoa pessoaPagador = null;
            if (cr.getContrato() != null && cr.getContrato().getResponsavelPrincipal() != null) {
                pessoaPagador = cr.getContrato().getResponsavelPrincipal();
            } else if (cr.getPessoa() != null) {
                pessoaPagador = cr.getPessoa();
            }
            if (pessoaPagador != null) {
                if (pessoaPagador.getEndereco() != null && !pessoaPagador.getEndereco().isBlank()) {
                    pagador.put("endereco", truncar(pessoaPagador.getEndereco(), 40));
                }
                if (pessoaPagador.getCidade() != null && !pessoaPagador.getCidade().isBlank()) {
                    pagador.put("cidade", truncar(pessoaPagador.getCidade(), 40));
                }
                if (pessoaPagador.getCep() != null && !pessoaPagador.getCep().isBlank()) {
                    String cepLimpo = pessoaPagador.getCep().replaceAll("[^0-9]", "");
                    pagador.put("cep", truncar(cepLimpo, 8));
                }
                if (pessoaPagador.getEstado() != null && !pessoaPagador.getEstado().isBlank()) {
                    pagador.put("uf", pessoaPagador.getEstado());
                }
                if (pessoaPagador.getEmail() != null && !pessoaPagador.getEmail().isBlank()) {
                    var emails = mapper.createArrayNode();
                    emails.add(pessoaPagador.getEmail());
                    pagador.set("email", emails);
                }
            }

            boletoObj.set("pagador", pagador);

            // Mensagens de instrução (do convênio, se configuradas)
            // API V3 espera formato: {"mensagem1": "...", "mensagem2": "...", ...}
            ObjectNode mensagensNode = mapper.createObjectNode();
            if (convenio != null && convenio.getMensagens() != null && !convenio.getMensagens().isBlank()) {
                String[] linhas = convenio.getMensagens().split("\n");
                for (int i = 0; i < 5; i++) {
                    String key = "mensagem" + (i + 1);
                    if (i < linhas.length && !linhas[i].isBlank()) {
                        mensagensNode.put(key, truncar(linhas[i].trim(), 80));
                    }
                }
            }
            boletoObj.set("mensagensInstrucao", mensagensNode);

            bodyJson = mapper.writeValueAsString(boletoObj);
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
            log.error("Erro ao registrar boleto na API Sicoob: HTTP {} - Body enviado: {} - Resposta: {}", e.getStatusCode(), bodyJson, errorBody);
            String msgErro = extrairMensagemErro(errorBody);
            throw new BoletoRegistroException(
                    "API Sicoob retornou erro " + e.getStatusCode().value() + ": " + msgErro);
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
                StringBuilder sb = new StringBuilder();
                for (JsonNode msg : node.get("mensagens")) {
                    if (msg.isObject() && msg.has("mensagem")) {
                        if (sb.length() > 0) sb.append(" | ");
                        sb.append(msg.get("mensagem").asText());
                        if (msg.has("campo")) sb.append(" (campo: ").append(msg.get("campo").asText()).append(")");
                    } else {
                        if (sb.length() > 0) sb.append(" | ");
                        sb.append(msg.asText());
                    }
                }
                if (sb.length() > 0) return sb.toString();
            }
            // Formato alternativo: {"erros":[...]}
            if (node.has("erros") && node.get("erros").isArray() && node.get("erros").size() > 0) {
                StringBuilder sb = new StringBuilder();
                for (JsonNode err : node.get("erros")) {
                    if (sb.length() > 0) sb.append(" | ");
                    sb.append(err.isObject() && err.has("mensagem") ? err.get("mensagem").asText() : err.asText());
                }
                return sb.toString();
            }
        } catch (Exception ignored) {}
        return errorBody != null && errorBody.length() > 500 ? errorBody.substring(0, 500) : errorBody;
    }

    private String truncar(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }

    private long parseLong(String s) {
        if (s == null || s.isBlank()) return 0;
        return Long.parseLong(s.replaceAll("[^0-9]", ""));
    }
}
