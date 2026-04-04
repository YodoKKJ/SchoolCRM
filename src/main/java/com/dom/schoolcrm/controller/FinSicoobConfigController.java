package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinConvenio;
import com.dom.schoolcrm.entity.FinSicoobConfig;
import com.dom.schoolcrm.service.FinSicoobConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Configuração da integração Sicoob (boletos híbridos).
 * Permite gerenciar credenciais, certificados e dados do beneficiário
 * diretamente pela interface do sistema, sem precisar editar env vars.
 */
@RestController
@RequestMapping("/fin/sicoob-config")
@PreAuthorize("hasRole('DIRECAO')")
public class FinSicoobConfigController {

    @Autowired
    private FinSicoobConfigService service;

    /**
     * Retorna a configuração atual (campos sensíveis ofuscados).
     */
    @GetMapping
    public ResponseEntity<?> obter() {
        try {
            FinSicoobConfig config = service.getConfig();
            return ResponseEntity.ok(service.toMapSeguro(config));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("erro",
                    "Erro ao carregar configuração: " + e.getMessage()));
        }
    }

    /**
     * Atualiza campos de configuração.
     * Campos sensíveis só são atualizados se o valor não for ofuscado.
     */
    @PutMapping
    public ResponseEntity<?> salvar(@RequestBody Map<String, Object> body) {
        try {
            FinSicoobConfig config = service.getConfig();

            if (body.containsKey("ativo")) {
                config.setAtivo(Boolean.TRUE.equals(body.get("ativo")));
            }
            if (body.containsKey("ambiente")) {
                String amb = String.valueOf(body.get("ambiente")).toUpperCase();
                if (!"SANDBOX".equals(amb) && !"PRODUCAO".equals(amb)) {
                    return ResponseEntity.badRequest().body(Map.of("erro", "Ambiente deve ser SANDBOX ou PRODUCAO"));
                }
                config.setAmbiente(amb);
                // Auto-ajustar URLs baseado no ambiente (V3)
                if ("PRODUCAO".equals(amb)) {
                    config.setBaseUrl("https://api.sicoob.com.br/cobranca-bancaria/v3");
                    config.setTokenUrl("https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token");
                } else {
                    config.setBaseUrl("https://sandbox.sicoob.com.br/sicoob/sandbox/cobranca-bancaria/v3");
                    config.setTokenUrl("https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token");
                }
            }
            if (body.containsKey("baseUrl")) {
                config.setBaseUrl(String.valueOf(body.get("baseUrl")));
            }
            if (body.containsKey("tokenUrl")) {
                config.setTokenUrl(String.valueOf(body.get("tokenUrl")));
            }
            if (body.containsKey("clientId")) {
                config.setClientId(String.valueOf(body.get("clientId")));
            }
            // Só atualiza secrets se não for o valor ofuscado
            if (body.containsKey("clientSecret")) {
                String val = String.valueOf(body.get("clientSecret"));
                if (!val.contains("••••••")) {
                    config.setClientSecret(val);
                }
            }
            if (body.containsKey("accessToken")) {
                String val = String.valueOf(body.get("accessToken"));
                if (!val.contains("••••••")) {
                    config.setAccessToken(val);
                }
            }
            if (body.containsKey("numeroContratoCobranca")) {
                config.setNumeroContratoCobranca(String.valueOf(body.get("numeroContratoCobranca")));
            }
            if (body.containsKey("numeroBeneficiario")) {
                config.setNumeroBeneficiario(String.valueOf(body.get("numeroBeneficiario")));
            }
            if (body.containsKey("cooperativa")) {
                config.setCooperativa(String.valueOf(body.get("cooperativa")));
            }
            if (body.containsKey("contaCorrente")) {
                config.setContaCorrente(String.valueOf(body.get("contaCorrente")));
            }
            if (body.containsKey("digitoConta")) {
                config.setDigitoConta(String.valueOf(body.get("digitoConta")));
            }
            if (body.containsKey("agencia")) {
                config.setAgencia(String.valueOf(body.get("agencia")));
            }
            if (body.containsKey("digitoAgencia")) {
                config.setDigitoAgencia(String.valueOf(body.get("digitoAgencia")));
            }
            if (body.containsKey("codigoBancoCorrespondente")) {
                config.setCodigoBancoCorrespondente(String.valueOf(body.get("codigoBancoCorrespondente")));
            }
            if (body.containsKey("codigoContaEmpresa")) {
                config.setCodigoContaEmpresa(String.valueOf(body.get("codigoContaEmpresa")));
            }
            if (body.containsKey("emiteBoletos")) {
                config.setEmiteBoletos(Boolean.TRUE.equals(body.get("emiteBoletos")));
            }
            if (body.containsKey("recebePix")) {
                config.setRecebePix(Boolean.TRUE.equals(body.get("recebePix")));
            }
            if (body.containsKey("webhookSecret")) {
                String val = String.valueOf(body.get("webhookSecret"));
                if (!val.contains("••••••")) {
                    config.setWebhookSecret(val);
                }
            }
            if (body.containsKey("modalidade")) {
                Object val = body.get("modalidade");
                if (val instanceof Number) {
                    config.setModalidade(((Number) val).intValue());
                } else if (val != null) {
                    try {
                        config.setModalidade(Integer.parseInt(String.valueOf(val)));
                    } catch (NumberFormatException e) {
                        return ResponseEntity.badRequest().body(Map.of("erro", "Modalidade deve ser um número"));
                    }
                }
            }
            if (body.containsKey("especieDocumento")) {
                config.setEspecieDocumento(String.valueOf(body.get("especieDocumento")));
            }
            if (body.containsKey("aceite")) {
                config.setAceite(Boolean.TRUE.equals(body.get("aceite")));
            }

            config = service.save(config);
            return ResponseEntity.ok(service.toMapSeguro(config));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("erro",
                    "Erro ao salvar configuração: " + e.getMessage()));
        }
    }

    /**
     * Upload do certificado digital (.pfx, .p12, ou .pem).
     */
    @PostMapping("/certificado")
    public ResponseEntity<?> uploadCertificado(
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam(value = "senha", required = false) String senha,
            @RequestParam(value = "tipo", defaultValue = "PFX") String tipo) {
        try {
            if (arquivo.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Arquivo vazio"));
            }

            String nome = arquivo.getOriginalFilename();
            if (nome != null && !nome.matches("(?i).*\\.(pfx|p12|pem|crt|cer)$")) {
                return ResponseEntity.badRequest().body(Map.of("erro",
                        "Formato não suportado. Use .pfx, .p12, .pem, .crt ou .cer"));
            }

            FinSicoobConfig config = service.uploadCertificado(arquivo, senha, tipo);
            return ResponseEntity.ok(service.toMapSeguro(config));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("erro",
                    "Erro ao salvar certificado: " + e.getMessage()));
        }
    }

    /**
     * Upload da chave privada (.key) — necessário para certificados PEM.
     */
    @PostMapping("/chave-privada")
    public ResponseEntity<?> uploadChavePrivada(@RequestParam("arquivo") MultipartFile arquivo) {
        try {
            if (arquivo.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erro", "Arquivo vazio"));
            }
            FinSicoobConfig config = service.uploadChavePrivada(arquivo);
            return ResponseEntity.ok(service.toMapSeguro(config));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("erro",
                    "Erro ao salvar chave privada: " + e.getMessage()));
        }
    }

    /**
     * Remove o certificado digital do servidor.
     */
    @DeleteMapping("/certificado")
    public ResponseEntity<?> removerCertificado() {
        try {
            FinSicoobConfig config = service.removerCertificado();
            return ResponseEntity.ok(service.toMapSeguro(config));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("erro",
                    "Erro ao remover certificado: " + e.getMessage()));
        }
    }

    /**
     * Testa se a configuração está completa para homologação.
     */
    @GetMapping("/testar")
    public ResponseEntity<?> testarConexao() {
        try {
            return ResponseEntity.ok(service.testarConexao());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("erro",
                    "Erro ao testar configuração: " + e.getMessage()));
        }
    }

    // ---- Convênios ----

    @GetMapping("/convenios")
    public ResponseEntity<?> listarConvenios() {
        try {
            List<Map<String, Object>> lista = service.listarConvenios().stream()
                    .map(service::convenioToMap)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(lista);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("erro",
                    "Erro ao listar convênios: " + e.getMessage()));
        }
    }

    @GetMapping("/convenios/{id}")
    public ResponseEntity<?> obterConvenio(@PathVariable Long id) {
        FinConvenio c = service.buscarConvenio(id);
        if (c == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(service.convenioToMap(c));
    }

    @PostMapping("/convenios")
    public ResponseEntity<?> criarConvenio(@RequestBody Map<String, Object> body) {
        try {
            FinConvenio c = new FinConvenio();
            preencherConvenio(c, body);
            c = service.salvarConvenio(c);
            return ResponseEntity.status(201).body(service.convenioToMap(c));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @PutMapping("/convenios/{id}")
    public ResponseEntity<?> atualizarConvenio(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            FinConvenio c = service.buscarConvenio(id);
            if (c == null) return ResponseEntity.notFound().build();
            preencherConvenio(c, body);
            c = service.salvarConvenio(c);
            return ResponseEntity.ok(service.convenioToMap(c));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erro", e.getMessage()));
        }
    }

    @DeleteMapping("/convenios/{id}")
    public ResponseEntity<?> deletarConvenio(@PathVariable Long id) {
        try {
            FinConvenio c = service.buscarConvenio(id);
            if (c == null) return ResponseEntity.notFound().build();
            service.deletarConvenio(id);
            return ResponseEntity.ok(Map.of("mensagem", "Convênio removido."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("erro", e.getMessage()));
        }
    }

    private void preencherConvenio(FinConvenio c, Map<String, Object> body) {
        if (body.containsKey("cnab")) c.setCnab(toInt(body.get("cnab"), 240));
        if (body.containsKey("numero")) c.setNumero(String.valueOf(body.get("numero")));
        if (body.containsKey("descricao")) c.setDescricao(String.valueOf(body.get("descricao")));
        if (body.containsKey("situacao")) c.setSituacao(String.valueOf(body.get("situacao")));
        if (body.containsKey("numeroCarteira")) c.setNumeroCarteira(String.valueOf(body.get("numeroCarteira")));
        if (body.containsKey("codigoCarteira")) c.setCodigoCarteira(String.valueOf(body.get("codigoCarteira")));
        if (body.containsKey("remessaReiniciaDiariamente")) c.setRemessaReiniciaDiariamente(Boolean.TRUE.equals(body.get("remessaReiniciaDiariamente")));
        if (body.containsKey("numeroRemessa")) c.setNumeroRemessa(toLong(body.get("numeroRemessa")));
        if (body.containsKey("tipoWebservice")) c.setTipoWebservice(String.valueOf(body.get("tipoWebservice")));
        if (body.containsKey("numeroContrato")) c.setNumeroContrato(String.valueOf(body.get("numeroContrato")));
        if (body.containsKey("nossoNumeroPeloBanco")) c.setNossoNumeroPeloBanco(Boolean.TRUE.equals(body.get("nossoNumeroPeloBanco")));
        if (body.containsKey("nossoNumeroAtual")) c.setNossoNumeroAtual(toLong(body.get("nossoNumeroAtual")));
        if (body.containsKey("percentualJuros")) c.setPercentualJuros(toBigDecimal(body.get("percentualJuros")));
        if (body.containsKey("percentualMulta")) c.setPercentualMulta(toBigDecimal(body.get("percentualMulta")));
        if (body.containsKey("percentualDesconto")) c.setPercentualDesconto(toBigDecimal(body.get("percentualDesconto")));
        if (body.containsKey("apiId")) c.setApiId(String.valueOf(body.get("apiId")));
        if (body.containsKey("modalidade")) c.setModalidade(toInt(body.get("modalidade"), 1));
        if (body.containsKey("especieDocumento")) c.setEspecieDocumento(String.valueOf(body.get("especieDocumento")));
        if (body.containsKey("aceite")) c.setAceite(Boolean.TRUE.equals(body.get("aceite")));
        if (body.containsKey("mensagens")) c.setMensagens(body.get("mensagens") != null ? String.valueOf(body.get("mensagens")) : null);
    }

    private int toInt(Object val, int def) {
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(String.valueOf(val)); } catch (Exception e) { return def; }
    }

    private Long toLong(Object val) {
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).longValue();
        try { return Long.parseLong(String.valueOf(val)); } catch (Exception e) { return null; }
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        try { return new BigDecimal(String.valueOf(val)); } catch (Exception e) { return BigDecimal.ZERO; }
    }
}
