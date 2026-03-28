package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Movimentação avulsa de caixa — entrada ou saída não recorrente.
 *
 * Exemplos de uso:
 *   ENTRADA → venda de uniforme, patrocínio de evento, doação
 *   SAÍDA   → compra de material de limpeza, pequeno reparo, canetão
 *
 * Pessoa e forma de pagamento são TOTALMENTE opcionais:
 * trata-se de um registro rápido de caixa, não de uma conta formal.
 */
@Entity
@Table(name = "fin_movimentacoes")
public class FinMovimentacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "escola_id")
    private Long escolaId;

    // ENTRADA | SAIDA
    @Column(nullable = false, length = 10)
    private String tipo;

    @Column(nullable = false)
    private String descricao;

    // Categoria livre (material, evento, reparo, uniforme, limpeza...)
    @Column(length = 100)
    private String categoria;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    @Column(name = "data_movimentacao", nullable = false)
    private LocalDate dataMovimentacao;

    // Pessoa vinculada — completamente opcional (caixa rápido)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id")
    private FinPessoa pessoa;

    // Forma de pagamento — opcional
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forma_pagamento_id")
    private FinFormaPagamento formaPagamento;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // Quem registrou — auditoria básica
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    private void prePersist() { this.createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Long getEscolaId() { return escolaId; }
    public void setEscolaId(Long escolaId) { this.escolaId = escolaId; }
    public String getTipo() { return tipo; }
    public String getDescricao() { return descricao; }
    public String getCategoria() { return categoria; }
    public BigDecimal getValor() { return valor; }
    public LocalDate getDataMovimentacao() { return dataMovimentacao; }
    public FinPessoa getPessoa() { return pessoa; }
    public FinFormaPagamento getFormaPagamento() { return formaPagamento; }
    public String getObservacoes() { return observacoes; }
    public Usuario getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setDataMovimentacao(LocalDate dataMovimentacao) { this.dataMovimentacao = dataMovimentacao; }
    public void setPessoa(FinPessoa pessoa) { this.pessoa = pessoa; }
    public void setFormaPagamento(FinFormaPagamento formaPagamento) { this.formaPagamento = formaPagamento; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public void setCreatedBy(Usuario createdBy) { this.createdBy = createdBy; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
