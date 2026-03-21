package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Boleto híbrido (boleto bancário + PIX) registrado via API Sicoob.
 * Cada boleto está vinculado a uma conta a receber (parcela ou avulsa).
 *
 * Status: EMITIDO | PAGO | CANCELADO | VENCIDO | REJEITADO
 * O status VENCIDO é calculado em runtime (EMITIDO + dataVencimento < hoje).
 */
@Entity
@Table(name = "fin_boletos",
       uniqueConstraints = @UniqueConstraint(columnNames = {"nosso_numero"}))
public class FinBoleto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "conta_receber_id", nullable = false)
    private FinContaReceber contaReceber;

    // Dados do boleto retornados pela API Sicoob
    @Column(name = "nosso_numero", length = 20)
    private String nossoNumero;

    @Column(name = "seu_numero", length = 30)
    private String seuNumero;

    @Column(name = "linha_digitavel", length = 60)
    private String linhaDigitavel;

    @Column(name = "codigo_barras", length = 50)
    private String codigoBarras;

    // PIX — QR code copia-e-cola e URL da imagem QR
    @Column(name = "pix_copia_cola", columnDefinition = "TEXT")
    private String pixCopiaCola;

    @Column(name = "pix_url", columnDefinition = "TEXT")
    private String pixUrl;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "valor_pago", precision = 10, scale = 2)
    private BigDecimal valorPago;

    @Column(name = "data_emissao", nullable = false)
    private LocalDate dataEmissao;

    @Column(name = "data_vencimento", nullable = false)
    private LocalDate dataVencimento;

    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;

    // EMITIDO | PAGO | CANCELADO | REJEITADO
    @Column(nullable = false, length = 20)
    private String status = "EMITIDO";

    // ID retornado pela API do Sicoob para operações de consulta/cancelamento
    @Column(name = "sicoob_id", length = 60)
    private String sicoobId;

    // Mensagem de erro caso o registro tenha sido rejeitado
    @Column(name = "erro_mensagem", columnDefinition = "TEXT")
    private String erroMensagem;

    // Dados do pagador (snapshot no momento da emissão)
    @Column(name = "pagador_nome")
    private String pagadorNome;

    @Column(name = "pagador_cpf_cnpj", length = 20)
    private String pagadorCpfCnpj;

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
    public FinContaReceber getContaReceber() { return contaReceber; }
    public String getNossoNumero() { return nossoNumero; }
    public String getSeuNumero() { return seuNumero; }
    public String getLinhaDigitavel() { return linhaDigitavel; }
    public String getCodigoBarras() { return codigoBarras; }
    public String getPixCopiaCola() { return pixCopiaCola; }
    public String getPixUrl() { return pixUrl; }
    public BigDecimal getValor() { return valor; }
    public BigDecimal getValorPago() { return valorPago; }
    public LocalDate getDataEmissao() { return dataEmissao; }
    public LocalDate getDataVencimento() { return dataVencimento; }
    public LocalDate getDataPagamento() { return dataPagamento; }
    public String getStatus() { return status; }
    public String getSicoobId() { return sicoobId; }
    public String getErroMensagem() { return erroMensagem; }
    public String getPagadorNome() { return pagadorNome; }
    public String getPagadorCpfCnpj() { return pagadorCpfCnpj; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setContaReceber(FinContaReceber contaReceber) { this.contaReceber = contaReceber; }
    public void setNossoNumero(String nossoNumero) { this.nossoNumero = nossoNumero; }
    public void setSeuNumero(String seuNumero) { this.seuNumero = seuNumero; }
    public void setLinhaDigitavel(String linhaDigitavel) { this.linhaDigitavel = linhaDigitavel; }
    public void setCodigoBarras(String codigoBarras) { this.codigoBarras = codigoBarras; }
    public void setPixCopiaCola(String pixCopiaCola) { this.pixCopiaCola = pixCopiaCola; }
    public void setPixUrl(String pixUrl) { this.pixUrl = pixUrl; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setValorPago(BigDecimal valorPago) { this.valorPago = valorPago; }
    public void setDataEmissao(LocalDate dataEmissao) { this.dataEmissao = dataEmissao; }
    public void setDataVencimento(LocalDate dataVencimento) { this.dataVencimento = dataVencimento; }
    public void setDataPagamento(LocalDate dataPagamento) { this.dataPagamento = dataPagamento; }
    public void setStatus(String status) { this.status = status; }
    public void setSicoobId(String sicoobId) { this.sicoobId = sicoobId; }
    public void setErroMensagem(String erroMensagem) { this.erroMensagem = erroMensagem; }
    public void setPagadorNome(String pagadorNome) { this.pagadorNome = pagadorNome; }
    public void setPagadorCpfCnpj(String pagadorCpfCnpj) { this.pagadorCpfCnpj = pagadorCpfCnpj; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
