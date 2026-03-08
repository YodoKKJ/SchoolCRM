package com.dom.schoolcrm.dto.relatorio;

/** Uma linha plana (aluno × matéria × valor) para os crosstabs de médias e frequência. */
public class TurmaJasperRowDTO {

    private String alunoNome;
    private String materiaNome;
    private Double valor;

    public TurmaJasperRowDTO() {}

    public TurmaJasperRowDTO(String alunoNome, String materiaNome, Double valor) {
        this.alunoNome = alunoNome;
        this.materiaNome = materiaNome;
        this.valor = valor;
    }

    public String getAlunoNome() { return alunoNome; }
    public void setAlunoNome(String alunoNome) { this.alunoNome = alunoNome; }

    public String getMateriaNome() { return materiaNome; }
    public void setMateriaNome(String materiaNome) { this.materiaNome = materiaNome; }

    public Double getValor() { return valor; }
    public void setValor(Double valor) { this.valor = valor; }
}
