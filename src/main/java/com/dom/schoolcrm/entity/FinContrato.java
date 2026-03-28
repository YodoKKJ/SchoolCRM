package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Contrato financeiro anual de um aluno.
 * Ao ser criado, gera automaticamente as parcelas em FinContaReceber.
 * Um aluno pode ter apenas 1 contrato ativo por ano letivo.
 */
@Entity
@Table(name = "fin_contratos",
       uniqueConstraints = @UniqueConstraint(columnNames = {"aluno_id", "ano_letivo"}))
public class FinContrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "escola_id")
    private Long escolaId;

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Usuario aluno;

    @ManyToOne
    @JoinColumn(name = "responsavel_principal_id", nullable = false)
    private FinPessoa responsavelPrincipal;

    @ManyToOne
    @JoinColumn(name = "responsavel_secundario_id")
    private FinPessoa responsavelSecundario;

    @ManyToOne
    @JoinColumn(name = "serie_id", nullable = false)
    private Serie serie;

    @Column(name = "ano_letivo", nullable = false)
    private Integer anoLetivo;

    // Valor base vindo de FinSerieValor (antes de desconto/acréscimo)
    @Column(name = "valor_base", precision = 10, scale = 2, nullable = false)
    private BigDecimal valorBase;

    // Valor total final (após desconto e acréscimo aplicados)
    @Column(name = "valor_total", precision = 10, scale = 2, nullable = false)
    private BigDecimal valorTotal;

    @Column(name = "num_parcelas", nullable = false)
    private Integer numParcelas;

    @Column(precision = 10, scale = 2)
    private BigDecimal desconto;

    @Column(precision = 10, scale = 2)
    private BigDecimal acrescimo;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    private void prePersist() { this.createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Long getEscolaId() { return escolaId; }
    public void setEscolaId(Long escolaId) { this.escolaId = escolaId; }
    public Usuario getAluno() { return aluno; }
    public FinPessoa getResponsavelPrincipal() { return responsavelPrincipal; }
    public FinPessoa getResponsavelSecundario() { return responsavelSecundario; }
    public Serie getSerie() { return serie; }
    public Integer getAnoLetivo() { return anoLetivo; }
    public BigDecimal getValorBase() { return valorBase; }
    public BigDecimal getValorTotal() { return valorTotal; }
    public Integer getNumParcelas() { return numParcelas; }
    public BigDecimal getDesconto() { return desconto; }
    public BigDecimal getAcrescimo() { return acrescimo; }
    public String getObservacoes() { return observacoes; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setAluno(Usuario aluno) { this.aluno = aluno; }
    public void setResponsavelPrincipal(FinPessoa responsavelPrincipal) { this.responsavelPrincipal = responsavelPrincipal; }
    public void setResponsavelSecundario(FinPessoa responsavelSecundario) { this.responsavelSecundario = responsavelSecundario; }
    public void setSerie(Serie serie) { this.serie = serie; }
    public void setAnoLetivo(Integer anoLetivo) { this.anoLetivo = anoLetivo; }
    public void setValorBase(BigDecimal valorBase) { this.valorBase = valorBase; }
    public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }
    public void setNumParcelas(Integer numParcelas) { this.numParcelas = numParcelas; }
    public void setDesconto(BigDecimal desconto) { this.desconto = desconto; }
    public void setAcrescimo(BigDecimal acrescimo) { this.acrescimo = acrescimo; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
