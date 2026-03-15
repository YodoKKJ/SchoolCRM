package com.dom.schoolcrm.dto.relatorio.fin;

/**
 * Linha do relatório de Contas a Receber por período.
 */
public class FinCRRelatorioItemDTO {

    private String alunoOuPessoa;
    private String descricao;
    private String tipo;
    private String parcela;
    private String vencimento;
    private String pagamento;
    private String valor;
    private String valorPago;
    private String saldo;
    private String status;
    private String formaPagamento;

    public FinCRRelatorioItemDTO() {}

    public FinCRRelatorioItemDTO(String alunoOuPessoa, String descricao, String tipo, String parcela,
                                  String vencimento, String pagamento, String valor,
                                  String valorPago, String saldo, String status, String formaPagamento) {
        this.alunoOuPessoa = alunoOuPessoa;
        this.descricao = descricao;
        this.tipo = tipo;
        this.parcela = parcela;
        this.vencimento = vencimento;
        this.pagamento = pagamento;
        this.valor = valor;
        this.valorPago = valorPago;
        this.saldo = saldo;
        this.status = status;
        this.formaPagamento = formaPagamento;
    }

    public String getAlunoOuPessoa() { return alunoOuPessoa; }
    public String getDescricao() { return descricao; }
    public String getTipo() { return tipo; }
    public String getParcela() { return parcela; }
    public String getVencimento() { return vencimento; }
    public String getPagamento() { return pagamento; }
    public String getValor() { return valor; }
    public String getValorPago() { return valorPago; }
    public String getSaldo() { return saldo; }
    public String getStatus() { return status; }
    public String getFormaPagamento() { return formaPagamento; }

    public void setAlunoOuPessoa(String v) { this.alunoOuPessoa = v; }
    public void setDescricao(String v) { this.descricao = v; }
    public void setTipo(String v) { this.tipo = v; }
    public void setParcela(String v) { this.parcela = v; }
    public void setVencimento(String v) { this.vencimento = v; }
    public void setPagamento(String v) { this.pagamento = v; }
    public void setValor(String v) { this.valor = v; }
    public void setValorPago(String v) { this.valorPago = v; }
    public void setSaldo(String v) { this.saldo = v; }
    public void setStatus(String v) { this.status = v; }
    public void setFormaPagamento(String v) { this.formaPagamento = v; }
}
