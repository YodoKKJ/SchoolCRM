package com.dom.schoolcrm.dto.relatorio.fin;

/**
 * Linha do relatório de Inadimplência.
 */
public class FinInadimplenciaItemDTO {

    private String alunoNome;
    private String responsavelNome;
    private String responsavelTelefone;
    private String descricao;
    private String parcela;
    private String vencimento;
    private Integer diasAtraso;
    private String valor;
    private String jurosMulta;
    private String saldo;

    public FinInadimplenciaItemDTO() {}

    public FinInadimplenciaItemDTO(String alunoNome, String responsavelNome, String responsavelTelefone,
                                    String descricao, String parcela, String vencimento,
                                    Integer diasAtraso, String valor, String jurosMulta, String saldo) {
        this.alunoNome = alunoNome;
        this.responsavelNome = responsavelNome;
        this.responsavelTelefone = responsavelTelefone;
        this.descricao = descricao;
        this.parcela = parcela;
        this.vencimento = vencimento;
        this.diasAtraso = diasAtraso;
        this.valor = valor;
        this.jurosMulta = jurosMulta;
        this.saldo = saldo;
    }

    public String getAlunoNome() { return alunoNome; }
    public String getResponsavelNome() { return responsavelNome; }
    public String getResponsavelTelefone() { return responsavelTelefone; }
    public String getDescricao() { return descricao; }
    public String getParcela() { return parcela; }
    public String getVencimento() { return vencimento; }
    public Integer getDiasAtraso() { return diasAtraso; }
    public String getValor() { return valor; }
    public String getJurosMulta() { return jurosMulta; }
    public String getSaldo() { return saldo; }

    public void setAlunoNome(String v) { this.alunoNome = v; }
    public void setResponsavelNome(String v) { this.responsavelNome = v; }
    public void setResponsavelTelefone(String v) { this.responsavelTelefone = v; }
    public void setDescricao(String v) { this.descricao = v; }
    public void setParcela(String v) { this.parcela = v; }
    public void setVencimento(String v) { this.vencimento = v; }
    public void setDiasAtraso(Integer v) { this.diasAtraso = v; }
    public void setValor(String v) { this.valor = v; }
    public void setJurosMulta(String v) { this.jurosMulta = v; }
    public void setSaldo(String v) { this.saldo = v; }
}
