package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "fin_serie_valor",
       uniqueConstraints = @UniqueConstraint(columnNames = {"serie_id", "ano_letivo"}))
public class FinSerieValor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "serie_id", nullable = false)
    private Serie serie;

    @Column(name = "ano_letivo", nullable = false)
    private Integer anoLetivo;

    @Column(name = "valor_padrao", precision = 10, scale = 2, nullable = false)
    private BigDecimal valorPadrao;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public Serie getSerie() { return serie; }
    public Integer getAnoLetivo() { return anoLetivo; }
    public BigDecimal getValorPadrao() { return valorPadrao; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(Long id) { this.id = id; }
    public void setSerie(Serie serie) { this.serie = serie; }
    public void setAnoLetivo(Integer anoLetivo) { this.anoLetivo = anoLetivo; }
    public void setValorPadrao(BigDecimal valorPadrao) { this.valorPadrao = valorPadrao; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
