package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "fin_configuracoes")
public class FinConfiguracao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "num_parcelas_padrao")
    private Integer numParcelasPadrao;

    @Column(name = "dia_vencimento_padrao")
    private Integer diaVencimentoPadrao;

    @Column(name = "juros_atraso_pct", precision = 5, scale = 2)
    private BigDecimal jurosAtrasoPct;

    @Column(name = "multa_atraso_pct", precision = 5, scale = 2)
    private BigDecimal multaAtrasoPct;

    public Long getId() { return id; }
    public Integer getNumParcelasPadrao() { return numParcelasPadrao; }
    public Integer getDiaVencimentoPadrao() { return diaVencimentoPadrao; }
    public BigDecimal getJurosAtrasoPct() { return jurosAtrasoPct; }
    public BigDecimal getMultaAtrasoPct() { return multaAtrasoPct; }

    public void setId(Long id) { this.id = id; }
    public void setNumParcelasPadrao(Integer numParcelasPadrao) { this.numParcelasPadrao = numParcelasPadrao; }
    public void setDiaVencimentoPadrao(Integer diaVencimentoPadrao) { this.diaVencimentoPadrao = diaVencimentoPadrao; }
    public void setJurosAtrasoPct(BigDecimal jurosAtrasoPct) { this.jurosAtrasoPct = jurosAtrasoPct; }
    public void setMultaAtrasoPct(BigDecimal multaAtrasoPct) { this.multaAtrasoPct = multaAtrasoPct; }
}
