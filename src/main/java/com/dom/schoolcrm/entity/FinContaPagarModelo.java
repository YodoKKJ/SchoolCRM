package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Template de conta a pagar recorrente (água, luz, internet, aluguel, etc.).
 * Não representa uma conta a pagar real — serve como base para gerar
 * instâncias em FinContaPagar via endpoint "gerar-recorrentes".
 */
@Entity
@Table(name = "fin_contas_pagar_modelo")
public class FinContaPagarModelo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String descricao;

    // AGUA | LUZ | INTERNET | ALUGUEL | LIMPEZA | MANUTENCAO | MATERIAL | OUTRO
    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    // Dia do mês para vencimento (1-28)
    @Column(name = "dia_vencimento", nullable = false)
    private Integer diaVencimento;

    // Fornecedor/empresa vinculada (opcional)
    @ManyToOne
    @JoinColumn(name = "pessoa_id")
    private FinPessoa pessoa;

    private Boolean ativo = true;

    public Long getId() { return id; }
    public String getDescricao() { return descricao; }
    public String getCategoria() { return categoria; }
    public BigDecimal getValor() { return valor; }
    public Integer getDiaVencimento() { return diaVencimento; }
    public FinPessoa getPessoa() { return pessoa; }
    public Boolean getAtivo() { return ativo; }

    public void setId(Long id) { this.id = id; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setDiaVencimento(Integer diaVencimento) { this.diaVencimento = diaVencimento; }
    public void setPessoa(FinPessoa pessoa) { this.pessoa = pessoa; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
