package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Conta a pagar individual: salário, conta fixa gerada de modelo,
 * ou lançamento avulso de fornecedor/despesa.
 *
 * tipos:
 *  SALARIO      → gerado por /gerar-folha, vinculado a FinFuncionario
 *  CONTA_FIXA   → gerado por /gerar-recorrentes a partir de FinContaPagarModelo
 *  FORNECEDOR   → lançamento avulso vinculado a pessoa/empresa
 *  OUTRO        → despesa geral sem vínculo
 *
 * Status armazenado: PENDENTE | PAGO | CANCELADO  (VENCIDO calculado em runtime)
 */
@Entity
@Table(name = "fin_contas_pagar")
public class FinContaPagar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "escola_id")
    private Long escolaId;

    // Modelo que gerou esta conta (nulo se lançamento manual)
    @ManyToOne
    @JoinColumn(name = "modelo_id")
    private FinContaPagarModelo modelo;

    // Funcionário (preenchido apenas para tipo SALARIO)
    @ManyToOne
    @JoinColumn(name = "funcionario_id")
    private FinFuncionario funcionario;

    // Fornecedor / empresa / pessoa que receberá o pagamento (opcional)
    @ManyToOne
    @JoinColumn(name = "pessoa_id")
    private FinPessoa pessoa;

    @Column(nullable = false)
    private String descricao;

    // SALARIO | CONTA_FIXA | FORNECEDOR | OUTRO
    @Column(nullable = false, length = 30)
    private String tipo;

    // AGUA | LUZ | INTERNET | ALUGUEL | SALARIO | LIMPEZA | MANUTENCAO | MATERIAL | OUTRO
    @Column(length = 50)
    private String categoria;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "valor_pago", precision = 10, scale = 2)
    private BigDecimal valorPago;

    @Column(name = "data_vencimento", nullable = false)
    private LocalDate dataVencimento;

    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;

    // PENDENTE | PAGO | CANCELADO
    @Column(nullable = false, length = 20)
    private String status = "PENDENTE";

    @ManyToOne
    @JoinColumn(name = "forma_pagamento_id")
    private FinFormaPagamento formaPagamento;

    // Mês de referência no formato "YYYY-MM" — útil para folha e recorrentes
    @Column(name = "mes_referencia", length = 7)
    private String mesReferencia;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "juros_aplicado", precision = 10, scale = 2)
    private BigDecimal jurosAplicado;

    @Column(name = "multa_aplicada", precision = 10, scale = 2)
    private BigDecimal multaAplicada;

    public Long getId() { return id; }
    public Long getEscolaId() { return escolaId; }
    public void setEscolaId(Long escolaId) { this.escolaId = escolaId; }
    public FinContaPagarModelo getModelo() { return modelo; }
    public FinFuncionario getFuncionario() { return funcionario; }
    public FinPessoa getPessoa() { return pessoa; }
    public String getDescricao() { return descricao; }
    public String getTipo() { return tipo; }
    public String getCategoria() { return categoria; }
    public BigDecimal getValor() { return valor; }
    public BigDecimal getValorPago() { return valorPago; }
    public LocalDate getDataVencimento() { return dataVencimento; }
    public LocalDate getDataPagamento() { return dataPagamento; }
    public String getStatus() { return status; }
    public FinFormaPagamento getFormaPagamento() { return formaPagamento; }
    public String getMesReferencia() { return mesReferencia; }
    public String getObservacoes() { return observacoes; }

    public void setId(Long id) { this.id = id; }
    public void setModelo(FinContaPagarModelo modelo) { this.modelo = modelo; }
    public void setFuncionario(FinFuncionario funcionario) { this.funcionario = funcionario; }
    public void setPessoa(FinPessoa pessoa) { this.pessoa = pessoa; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setValorPago(BigDecimal valorPago) { this.valorPago = valorPago; }
    public void setDataVencimento(LocalDate dataVencimento) { this.dataVencimento = dataVencimento; }
    public void setDataPagamento(LocalDate dataPagamento) { this.dataPagamento = dataPagamento; }
    public void setStatus(String status) { this.status = status; }
    public void setFormaPagamento(FinFormaPagamento formaPagamento) { this.formaPagamento = formaPagamento; }
    public void setMesReferencia(String mesReferencia) { this.mesReferencia = mesReferencia; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public BigDecimal getJurosAplicado() { return jurosAplicado; }
    public void setJurosAplicado(BigDecimal jurosAplicado) { this.jurosAplicado = jurosAplicado; }
    public BigDecimal getMultaAplicada() { return multaAplicada; }
    public void setMultaAplicada(BigDecimal multaAplicada) { this.multaAplicada = multaAplicada; }
}
