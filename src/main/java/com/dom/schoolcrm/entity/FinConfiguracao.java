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

    @Column(name = "media_minima", precision = 4, scale = 2)
    private BigDecimal mediaMinima;   // padrão 6.0

    @Column(name = "freq_minima", precision = 4, scale = 2)
    private BigDecimal freqMinima;    // padrão 75.0

    // Sentinel que garante apenas um registro na tabela (singleton pattern)
    @Column(name = "singleton_key", unique = true, nullable = false, length = 8)
    private String singletonKey = "default";

    public Long getId() { return id; }
    public Integer getNumParcelasPadrao() { return numParcelasPadrao; }
    public Integer getDiaVencimentoPadrao() { return diaVencimentoPadrao; }
    public BigDecimal getJurosAtrasoPct() { return jurosAtrasoPct; }
    public BigDecimal getMultaAtrasoPct() { return multaAtrasoPct; }
    public BigDecimal getMediaMinima() { return mediaMinima; }
    public BigDecimal getFreqMinima() { return freqMinima; }

    public void setId(Long id) { this.id = id; }
    public void setNumParcelasPadrao(Integer numParcelasPadrao) { this.numParcelasPadrao = numParcelasPadrao; }
    public void setDiaVencimentoPadrao(Integer diaVencimentoPadrao) { this.diaVencimentoPadrao = diaVencimentoPadrao; }
    public void setJurosAtrasoPct(BigDecimal jurosAtrasoPct) { this.jurosAtrasoPct = jurosAtrasoPct; }
    public void setMultaAtrasoPct(BigDecimal multaAtrasoPct) { this.multaAtrasoPct = multaAtrasoPct; }
    public void setMediaMinima(BigDecimal mediaMinima) { this.mediaMinima = mediaMinima; }
    public void setFreqMinima(BigDecimal freqMinima) { this.freqMinima = freqMinima; }
}
