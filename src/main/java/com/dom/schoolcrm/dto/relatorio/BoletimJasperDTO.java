package com.dom.schoolcrm.dto.relatorio;

public class BoletimJasperDTO {

    private String materiaNome;

    private String media1;
    private Integer faltas1;
    private String media2;
    private Integer faltas2;
    private String media3;
    private Integer faltas3;
    private String media4;
    private Integer faltas4;

    private String mediaAnual;
    private Integer totalFaltas;
    private String frequencia;
    private String situacao;

    // usado para conditional styles no JRXML
    private Double mediaAnualDouble;
    private Double frequenciaDouble;

    public BoletimJasperDTO() {}

    public String getMateriaNome() { return materiaNome; }
    public void setMateriaNome(String materiaNome) { this.materiaNome = materiaNome; }

    public String getMedia1() { return media1; }
    public void setMedia1(String media1) { this.media1 = media1; }

    public Integer getFaltas1() { return faltas1; }
    public void setFaltas1(Integer faltas1) { this.faltas1 = faltas1; }

    public String getMedia2() { return media2; }
    public void setMedia2(String media2) { this.media2 = media2; }

    public Integer getFaltas2() { return faltas2; }
    public void setFaltas2(Integer faltas2) { this.faltas2 = faltas2; }

    public String getMedia3() { return media3; }
    public void setMedia3(String media3) { this.media3 = media3; }

    public Integer getFaltas3() { return faltas3; }
    public void setFaltas3(Integer faltas3) { this.faltas3 = faltas3; }

    public String getMedia4() { return media4; }
    public void setMedia4(String media4) { this.media4 = media4; }

    public Integer getFaltas4() { return faltas4; }
    public void setFaltas4(Integer faltas4) { this.faltas4 = faltas4; }

    public String getMediaAnual() { return mediaAnual; }
    public void setMediaAnual(String mediaAnual) { this.mediaAnual = mediaAnual; }

    public Integer getTotalFaltas() { return totalFaltas; }
    public void setTotalFaltas(Integer totalFaltas) { this.totalFaltas = totalFaltas; }

    public String getFrequencia() { return frequencia; }
    public void setFrequencia(String frequencia) { this.frequencia = frequencia; }

    public String getSituacao() { return situacao; }
    public void setSituacao(String situacao) { this.situacao = situacao; }

    public Double getMediaAnualDouble() { return mediaAnualDouble; }
    public void setMediaAnualDouble(Double mediaAnualDouble) { this.mediaAnualDouble = mediaAnualDouble; }

    public Double getFrequenciaDouble() { return frequenciaDouble; }
    public void setFrequenciaDouble(Double frequenciaDouble) { this.frequenciaDouble = frequenciaDouble; }
}
