package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Representa uma conta a receber: pode ser uma parcela de contrato
 * ou um recebimento avulso (matrícula, uniforme, evento, etc.).
 *
 * Status armazenado: PENDENTE | PAGO | CANCELADO
 * Status VENCIDO é calculado em runtime: PENDENTE + dataVencimento < hoje
 */
@Entity
@Table(name = "fin_contas_receber")
public class FinContaReceber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "escola_id")
    private Long escolaId;

    // Nulo para lançamentos avulsos (matrícula, uniforme, evento...)
    @ManyToOne
    @JoinColumn(name = "contrato_id")
    private FinContrato contrato;

    // Pessoa pagadora — usada em CR avulsa; em parcelas, vem do contrato
    @ManyToOne
    @JoinColumn(name = "pessoa_id")
    private FinPessoa pessoa;

    @Column(nullable = false)
    private String descricao;

    // MENSALIDADE | MATRICULA | UNIFORME | EVENTO | OUTRO
    @Column(nullable = false, length = 30)
    private String tipo;

    @Column(name = "num_parcela")
    private Integer numParcela;

    @Column(name = "total_parcelas")
    private Integer totalParcelas;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "valor_pago", precision = 10, scale = 2)
    private BigDecimal valorPago;

    @Column(name = "data_vencimento", nullable = false)
    private LocalDate dataVencimento;

    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;

    // PENDENTE | PAGO | CANCELADO  (VENCIDO é computado)
    @Column(nullable = false, length = 20)
    private String status = "PENDENTE";

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
    public Long getEscolaId() { return escolaId; }
    public void setEscolaId(Long escolaId) { this.escolaId = escolaId; }
    public FinContrato getContrato() { return contrato; }
    public FinPessoa getPessoa() { return pessoa; }
    public String getDescricao() { return descricao; }
    public String getTipo() { return tipo; }
    public Integer getNumParcela() { return numParcela; }
    public Integer getTotalParcelas() { return totalParcelas; }
    public BigDecimal getValor() { return valor; }
    public BigDecimal getValorPago() { return valorPago; }
    public LocalDate getDataVencimento() { return dataVencimento; }
    public LocalDate getDataPagamento() { return dataPagamento; }
    public String getStatus() { return status; }
    public FinFormaPagamento getFormaPagamento() { return formaPagamento; }
    public BigDecimal getJurosAplicado() { return jurosAplicado; }
    public BigDecimal getMultaAplicada() { return multaAplicada; }
    public String getObservacoes() { return observacoes; }

    public void setId(Long id) { this.id = id; }
    public void setContrato(FinContrato contrato) { this.contrato = contrato; }
    public void setPessoa(FinPessoa pessoa) { this.pessoa = pessoa; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public void setNumParcela(Integer numParcela) { this.numParcela = numParcela; }
    public void setTotalParcelas(Integer totalParcelas) { this.totalParcelas = totalParcelas; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setValorPago(BigDecimal valorPago) { this.valorPago = valorPago; }
    public void setDataVencimento(LocalDate dataVencimento) { this.dataVencimento = dataVencimento; }
    public void setDataPagamento(LocalDate dataPagamento) { this.dataPagamento = dataPagamento; }
    public void setStatus(String status) { this.status = status; }
    public void setFormaPagamento(FinFormaPagamento formaPagamento) { this.formaPagamento = formaPagamento; }
    public void setJurosAplicado(BigDecimal jurosAplicado) { this.jurosAplicado = jurosAplicado; }
    public void setMultaAplicada(BigDecimal multaAplicada) { this.multaAplicada = multaAplicada; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
}
