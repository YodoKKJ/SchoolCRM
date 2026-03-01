package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Benefícios e adicionais de um funcionário.
 * Tipos: VALE_REFEICAO, VALE_TRANSPORTE, BONUS, HORA_EXTRA, OUTRO.
 * Cada registro é um benefício individual — permite múltiplos do mesmo tipo
 * (ex: dois tipos de bônus diferentes).
 */
@Entity
@Table(name = "fin_beneficios")
public class FinBeneficio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "funcionario_id", nullable = false)
    private FinFuncionario funcionario;

    // VALE_REFEICAO | VALE_TRANSPORTE | BONUS | HORA_EXTRA | OUTRO
    @Column(nullable = false, length = 30)
    private String tipo;

    // Descrição livre (ex: "Bônus por desempenho Q1", "Hora extra 15/02")
    private String descricao;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    // Permite desativar sem deletar (histórico)
    private Boolean ativo = true;

    public Long getId() { return id; }
    public FinFuncionario getFuncionario() { return funcionario; }
    public String getTipo() { return tipo; }
    public String getDescricao() { return descricao; }
    public BigDecimal getValor() { return valor; }
    public Boolean getAtivo() { return ativo; }

    public void setId(Long id) { this.id = id; }
    public void setFuncionario(FinFuncionario funcionario) { this.funcionario = funcionario; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
