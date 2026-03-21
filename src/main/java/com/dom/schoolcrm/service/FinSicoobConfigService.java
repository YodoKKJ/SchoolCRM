package com.dom.schoolcrm.service;

import com.dom.schoolcrm.entity.FinSicoobConfig;
import com.dom.schoolcrm.repository.FinSicoobConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.KeyStore;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Serviço para gerenciar a configuração da integração Sicoob.
 * Armazena dados no banco e certificados no filesystem.
 */
@Service
public class FinSicoobConfigService {

    private static final String CERT_DIR = "config/certs";

    @Autowired
    private FinSicoobConfigRepository repository;

    /**
     * Retorna a config singleton. Cria com defaults se não existir.
     * Thread-safe: se dois requests tentam criar ao mesmo tempo,
     * o segundo pega o registro já criado pelo primeiro.
     */
    @Transactional
    public FinSicoobConfig getConfig() {
        return repository.findAll().stream().findFirst()
                .orElseGet(() -> {
                    try {
                        FinSicoobConfig c = new FinSicoobConfig();
                        return repository.save(c);
                    } catch (DataIntegrityViolationException e) {
                        // Race condition: outro thread já criou — buscar novamente
                        return repository.findAll().stream().findFirst()
                                .orElseThrow(() -> new RuntimeException("Não foi possível criar configuração Sicoob"));
                    }
                });
    }

    /**
     * Salva as configurações (exceto certificado, que tem endpoint próprio).
     */
    @Transactional
    public FinSicoobConfig save(FinSicoobConfig config) {
        return repository.save(config);
    }

    /**
     * Faz upload e salva o certificado digital (.pfx ou .pem).
     * Para PFX: lê a validade do certificado automaticamente.
     */
    @Transactional
    public FinSicoobConfig uploadCertificado(MultipartFile arquivo, String senha, String tipo) throws IOException {
        FinSicoobConfig config = getConfig();

        // Criar diretório de certs se não existir
        Path certDir = Paths.get(CERT_DIR);
        Files.createDirectories(certDir);

        // Remover certificado anterior se existir
        if (config.getCertCaminho() != null) {
            try { Files.deleteIfExists(Paths.get(config.getCertCaminho())); } catch (Exception ignored) {}
        }
        if (config.getCertKeyCaminho() != null) {
            try { Files.deleteIfExists(Paths.get(config.getCertKeyCaminho())); } catch (Exception ignored) {}
        }

        // Salvar o arquivo
        String nomeOriginal = arquivo.getOriginalFilename();
        String extensao = nomeOriginal != null && nomeOriginal.contains(".")
                ? nomeOriginal.substring(nomeOriginal.lastIndexOf(".")) : ".pfx";
        String nomeArquivo = "sicoob_cert_" + System.currentTimeMillis() + extensao;
        Path destino = certDir.resolve(nomeArquivo);
        Files.copy(arquivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

        config.setCertTipo(tipo != null ? tipo.toUpperCase() : "PFX");
        config.setCertNomeArquivo(nomeOriginal);
        config.setCertCaminho(destino.toString());
        config.setCertSenha(senha);

        // Tentar ler validade do certificado (PFX/P12)
        if ("PFX".equalsIgnoreCase(tipo) || "P12".equalsIgnoreCase(tipo)) {
            try {
                KeyStore keyStore = KeyStore.getInstance("PKCS12");
                keyStore.load(Files.newInputStream(destino), senha != null ? senha.toCharArray() : null);
                Enumeration<String> aliases = keyStore.aliases();
                if (aliases.hasMoreElements()) {
                    String alias = aliases.nextElement();
                    X509Certificate cert = (X509Certificate) keyStore.getCertificate(alias);
                    if (cert != null) {
                        config.setCertValidade(
                            cert.getNotAfter().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                        );
                    }
                }
            } catch (Exception e) {
                // Se não conseguir ler, apenas loga — não impede o upload
                System.err.println("Aviso: não foi possível ler validade do certificado: " + e.getMessage());
            }
        }

        return repository.save(config);
    }

    /**
     * Upload da chave privada (.key) para certificados PEM.
     */
    @Transactional
    public FinSicoobConfig uploadChavePrivada(MultipartFile arquivo) throws IOException {
        FinSicoobConfig config = getConfig();

        Path certDir = Paths.get(CERT_DIR);
        Files.createDirectories(certDir);

        if (config.getCertKeyCaminho() != null) {
            try { Files.deleteIfExists(Paths.get(config.getCertKeyCaminho())); } catch (Exception ignored) {}
        }

        String nomeArquivo = "sicoob_key_" + System.currentTimeMillis() + ".key";
        Path destino = certDir.resolve(nomeArquivo);
        Files.copy(arquivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

        config.setCertKeyCaminho(destino.toString());
        return repository.save(config);
    }

    /**
     * Remove o certificado digital.
     */
    @Transactional
    public FinSicoobConfig removerCertificado() {
        FinSicoobConfig config = getConfig();

        if (config.getCertCaminho() != null) {
            try { Files.deleteIfExists(Paths.get(config.getCertCaminho())); } catch (Exception ignored) {}
        }
        if (config.getCertKeyCaminho() != null) {
            try { Files.deleteIfExists(Paths.get(config.getCertKeyCaminho())); } catch (Exception ignored) {}
        }

        config.setCertTipo(null);
        config.setCertNomeArquivo(null);
        config.setCertCaminho(null);
        config.setCertSenha(null);
        config.setCertKeyCaminho(null);
        config.setCertValidade(null);

        return repository.save(config);
    }

    /**
     * Testa a conexão com a API Sicoob (valida certificado + credenciais).
     * Por enquanto retorna apenas validação local.
     */
    public Map<String, Object> testarConexao() {
        FinSicoobConfig config = getConfig();
        Map<String, Object> result = new LinkedHashMap<>();

        boolean temClientId = config.getClientId() != null && !config.getClientId().isBlank();
        boolean temClientSecret = config.getClientSecret() != null && !config.getClientSecret().isBlank();
        boolean temCert = config.getCertCaminho() != null;

        boolean certExiste = false;
        if (temCert) {
            try {
                certExiste = Files.exists(Paths.get(config.getCertCaminho()));
            } catch (Exception e) {
                certExiste = false; // Caminho inválido = não encontrado
            }
        }

        boolean temBeneficiario = config.getNumeroBeneficiario() != null && !config.getNumeroBeneficiario().isBlank();
        boolean temCooperativa = config.getCooperativa() != null && !config.getCooperativa().isBlank();
        boolean temConta = config.getContaCorrente() != null && !config.getContaCorrente().isBlank();

        result.put("clientId", temClientId ? "OK" : "AUSENTE");
        result.put("clientSecret", temClientSecret ? "OK" : "AUSENTE");
        result.put("certificado", !temCert ? "NÃO ENVIADO" : (certExiste ? "OK" : "ARQUIVO NÃO ENCONTRADO"));
        result.put("numeroBeneficiario", temBeneficiario ? "OK" : "AUSENTE");
        result.put("cooperativa", temCooperativa ? "OK" : "AUSENTE");
        result.put("contaCorrente", temConta ? "OK" : "AUSENTE");

        boolean todosOk = temClientId && temClientSecret && certExiste && temBeneficiario && temCooperativa && temConta;
        result.put("prontoParaHomologacao", todosOk);
        result.put("ambiente", config.getAmbiente());
        result.put("ativo", config.isAtivo());

        return result;
    }

    /**
     * Converte config para mapa seguro (ofusca campos sensíveis).
     */
    public Map<String, Object> toMapSeguro(FinSicoobConfig config) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", config.getId());
        m.put("ativo", config.isAtivo());
        m.put("ambiente", config.getAmbiente());
        m.put("baseUrl", config.getBaseUrl());
        m.put("tokenUrl", config.getTokenUrl());
        m.put("clientId", config.getClientId());
        m.put("clientSecret", ofuscar(config.getClientSecret()));
        m.put("numeroBeneficiario", config.getNumeroBeneficiario());
        m.put("cooperativa", config.getCooperativa());
        m.put("contaCorrente", config.getContaCorrente());
        m.put("webhookSecret", ofuscar(config.getWebhookSecret()));
        m.put("certTipo", config.getCertTipo());
        m.put("certNomeArquivo", config.getCertNomeArquivo());
        m.put("certValidade", config.getCertValidade());
        m.put("temCertificado", config.getCertCaminho() != null);
        m.put("temChavePrivada", config.getCertKeyCaminho() != null);
        m.put("modalidade", config.getModalidade());
        m.put("especieDocumento", config.getEspecieDocumento());
        m.put("aceite", config.getAceite());
        m.put("atualizadoEm", config.getAtualizadoEm());
        return m;
    }

    private String ofuscar(String valor) {
        if (valor == null || valor.isBlank()) return null;
        if (valor.length() <= 6) return "••••••";
        return valor.substring(0, 3) + "••••••" + valor.substring(valor.length() - 3);
    }
}
