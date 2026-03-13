package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Registro imutável de cada baixa efetuada em uma FinContaPagar.
 * Garante rastreabilidade histórica de pagamentos parciais e totais.
 */
@Entity
@Table(name = "fin_historico_pagamento_cp")
public class FinHistoricoPagamentoCP {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "conta_pagar_id", nullable = false)
    private FinContaPagar contaPagar;

    /** Momento exato em que a baixa foi registrada no sistema */
    @Column(name = "data_registro", nullable = false)
    private LocalDateTime dataRegistro;

    @Column(name = "data_pagamento", nullable = false)
    private LocalDate dataPagamento;

    @Column(name = "valor_pago", precision = 10, scale = 2, nullable = false)
    private BigDecimal valorPago;

    @ManyToOne
    @JoinColumn(name = "forma_pagamento_id")
    private FinFormaPagamento formaPagamento;

    @Column(name = "juros_aplicado", precision = 10, scale = 2)
    private BigDecimal jurosAplicado;

    @Column(name = "multa_aplicada", precision = 10, scale = 2)
    private BigDecimal multaAplicada;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    public Long getId() { return id; }
    public FinContaPagar getContaPagar() { return contaPagar; }
    public LocalDateTime getDataRegistro() { return dataRegistro; }
    public LocalDate getDataPagamento() { return dataPagamento; }
    public BigDecimal getValorPago() { return valorPago; }
    public FinFormaPagamento getFormaPagamento() { return formaPagamento; }
    public BigDecimal getJurosAplicado() { return jurosAplicado; }
    public BigDecimal getMultaAplicada() { return multaAplicada; }
    public String getObservacoes() { return observacoes; }

    public void setContaPagar(FinContaPagar contaPagar) { this.contaPagar = contaPagar; }
    public void setDataRegistro(LocalDateTime dataRegistro) { this.dataRegistro = dataRegistro; }
    public void setDataPagamento(LocalDate dataPagamento) { this.dataPagamento = dataPagamento; }
    public void setValorPago(BigDecimal valorPago) { this.valorPago = valorPago; }
    public void setFormaPagamento(FinFormaPagamento formaPagamento) { this.formaPagamento = formaPagamento; }
    public void setJurosAplicado(BigDecimal jurosAplicado) { this.jurosAplicado = jurosAplicado; }
    public void setMultaAplicada(BigDecimal multaAplicada) { this.multaAplicada = multaAplicada; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
}
