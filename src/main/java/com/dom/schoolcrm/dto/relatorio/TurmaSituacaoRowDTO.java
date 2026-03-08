package com.dom.schoolcrm.dto.relatorio;

/** Uma linha do relatório de Situação Final por turma. */
public class TurmaSituacaoRowDTO {

    private String alunoNome;
    private String situacao;
    private String frequenciaGeral;
    private String materiasRisco;

    // usado para conditional style no JRXML
    private Double frequenciaGeralDouble;

    public TurmaSituacaoRowDTO() {}

    public String getAlunoNome() { return alunoNome; }
    public void setAlunoNome(String alunoNome) { this.alunoNome = alunoNome; }

    public String getSituacao() { return situacao; }
    public void setSituacao(String situacao) { this.situacao = situacao; }

    public String getFrequenciaGeral() { return frequenciaGeral; }
    public void setFrequenciaGeral(String frequenciaGeral) { this.frequenciaGeral = frequenciaGeral; }

    public String getMateriaRisco() { return materiasRisco; }
    public void setMateriaRisco(String materiasRisco) { this.materiasRisco = materiasRisco; }

    public Double getFrequenciaGeralDouble() { return frequenciaGeralDouble; }
    public void setFrequenciaGeralDouble(Double frequenciaGeralDouble) { this.frequenciaGeralDouble = frequenciaGeralDouble; }
}
