package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.entity.FinSicoobConfig;
import com.dom.schoolcrm.service.FinSicoobConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

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
}
