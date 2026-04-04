package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Convênio de cobrança bancária vinculado à configuração Sicoob.
 * Uma conta pode ter múltiplos convênios (ex: mensalidade, matrícula).
 * Cada convênio define carteira, nosso número, juros, multa, desconto, etc.
 */
@Entity
@Table(name = "fin_convenios")
public class FinConvenio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sicoob_config_id", nullable = false)
    private FinSicoobConfig sicoobConfig;

    // CNAB: 240 ou 400
    @Column(name = "cnab", nullable = false)
    private Integer cnab = 240;

    // Número do convênio
    @Column(name = "numero", length = 20, nullable = false)
    private String numero;

    // Descrição do convênio (ex: "Mensalidades Escolares")
    @Column(name = "descricao", length = 100, nullable = false)
    private String descricao;

    // ATIVA ou INATIVA
    @Column(name = "situacao", length = 10, nullable = false)
    private String situacao = "ATIVA";

    // Número da carteira (obrigatório)
    @Column(name = "numero_carteira", length = 10, nullable = false)
    private String numeroCarteira;

    // Código da carteira
    @Column(name = "codigo_carteira", length = 10)
    private String codigoCarteira;

    // Se a numeração de remessa reinicia diariamente
    @Column(name = "remessa_reinicia_diariamente")
    private Boolean remessaReiniciaDiariamente = false;

    // Número sequencial da remessa
    @Column(name = "numero_remessa")
    private Long numeroRemessa;

    // Tipo de webservice (API, CNAB, etc.)
    @Column(name = "tipo_webservice", length = 30)
    private String tipoWebservice;

    // Número do contrato de cobrança no Sicoob
    @Column(name = "numero_contrato", length = 30)
    private String numeroContrato;

    // Se o nosso número é gerado pelo banco ou pelo sistema
    @Column(name = "nosso_numero_pelo_banco")
    private Boolean nossoNumeroPeloBanco = false;

    // Próximo nosso número (quando gerado pelo sistema)
    @Column(name = "nosso_numero_atual")
    private Long nossoNumeroAtual;

    // Percentual de juros ao mês (ex: 2.00 = 2%)
    @Column(name = "percentual_juros", precision = 5, scale = 2)
    private BigDecimal percentualJuros = BigDecimal.ZERO;

    // Percentual de multa (ex: 2.00 = 2%)
    @Column(name = "percentual_multa", precision = 5, scale = 2)
    private BigDecimal percentualMulta = BigDecimal.ZERO;

    // Percentual de desconto para pagamento antecipado
    @Column(name = "percentual_desconto", precision = 5, scale = 2)
    private BigDecimal percentualDesconto = BigDecimal.ZERO;

    // API ID fornecido pelo banco (Client ID específico do convênio)
    @Column(name = "api_id", length = 255)
    private String apiId;

    // Modalidade: 1=Simples com Registro, 2=Vinculada, 3=Caucionada
    @Column(name = "modalidade")
    private Integer modalidade = 1;

    // Espécie do documento: DM, DS, RC, NP, OU
    @Column(name = "especie_documento", length = 5)
    private String especieDocumento = "DM";

    // Aceite automático
    @Column(name = "aceite")
    private Boolean aceite = false;

    // Mensagens de instrução para o boleto (até 5 linhas, separadas por \n)
    @Column(name = "mensagens", columnDefinition = "TEXT")
    private String mensagens;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    private void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    private void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public FinSicoobConfig getSicoobConfig() { return sicoobConfig; }
    public Integer getCnab() { return cnab; }
    public String getNumero() { return numero; }
    public String getDescricao() { return descricao; }
    public String getSituacao() { return situacao; }
    public String getNumeroCarteira() { return numeroCarteira; }
    public String getCodigoCarteira() { return codigoCarteira; }
    public Boolean getRemessaReiniciaDiariamente() { return remessaReiniciaDiariamente; }
    public Long getNumeroRemessa() { return numeroRemessa; }
    public String getTipoWebservice() { return tipoWebservice; }
    public String getNumeroContrato() { return numeroContrato; }
    public Boolean getNossoNumeroPeloBanco() { return nossoNumeroPeloBanco; }
    public Long getNossoNumeroAtual() { return nossoNumeroAtual; }
    public BigDecimal getPercentualJuros() { return percentualJuros; }
    public BigDecimal getPercentualMulta() { return percentualMulta; }
    public BigDecimal getPercentualDesconto() { return percentualDesconto; }
    public String getApiId() { return apiId; }
    public Integer getModalidade() { return modalidade; }
    public String getEspecieDocumento() { return especieDocumento; }
    public Boolean getAceite() { return aceite; }
    public String getMensagens() { return mensagens; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setSicoobConfig(FinSicoobConfig sicoobConfig) { this.sicoobConfig = sicoobConfig; }
    public void setCnab(Integer cnab) { this.cnab = cnab; }
    public void setNumero(String numero) { this.numero = numero; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setSituacao(String situacao) { this.situacao = situacao; }
    public void setNumeroCarteira(String numeroCarteira) { this.numeroCarteira = numeroCarteira; }
    public void setCodigoCarteira(String codigoCarteira) { this.codigoCarteira = codigoCarteira; }
    public void setRemessaReiniciaDiariamente(Boolean remessaReiniciaDiariamente) { this.remessaReiniciaDiariamente = remessaReiniciaDiariamente; }
    public void setNumeroRemessa(Long numeroRemessa) { this.numeroRemessa = numeroRemessa; }
    public void setTipoWebservice(String tipoWebservice) { this.tipoWebservice = tipoWebservice; }
    public void setNumeroContrato(String numeroContrato) { this.numeroContrato = numeroContrato; }
    public void setNossoNumeroPeloBanco(Boolean nossoNumeroPeloBanco) { this.nossoNumeroPeloBanco = nossoNumeroPeloBanco; }
    public void setNossoNumeroAtual(Long nossoNumeroAtual) { this.nossoNumeroAtual = nossoNumeroAtual; }
    public void setPercentualJuros(BigDecimal percentualJuros) { this.percentualJuros = percentualJuros; }
    public void setPercentualMulta(BigDecimal percentualMulta) { this.percentualMulta = percentualMulta; }
    public void setPercentualDesconto(BigDecimal percentualDesconto) { this.percentualDesconto = percentualDesconto; }
    public void setApiId(String apiId) { this.apiId = apiId; }
    public void setModalidade(Integer modalidade) { this.modalidade = modalidade; }
    public void setEspecieDocumento(String especieDocumento) { this.especieDocumento = especieDocumento; }
    public void setAceite(Boolean aceite) { this.aceite = aceite; }
    public void setMensagens(String mensagens) { this.mensagens = mensagens; }
}
