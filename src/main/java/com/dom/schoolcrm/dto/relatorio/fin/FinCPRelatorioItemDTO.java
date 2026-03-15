package com.dom.schoolcrm.dto.relatorio.fin;

/**
 * Linha do relatório de Contas a Pagar por período.
 */
public class FinCPRelatorioItemDTO {

    private String descricao;
    private String tipo;
    private String categoria;
    private String beneficiario;
    private String vencimento;
    private String pagamento;
    private String valor;
    private String valorPago;
    private String saldo;
    private String status;
    private String formaPagamento;

    public FinCPRelatorioItemDTO() {}

    public FinCPRelatorioItemDTO(String descricao, String tipo, String categoria, String beneficiario,
                                  String vencimento, String pagamento, String valor,
                                  String valorPago, String saldo, String status, String formaPagamento) {
        this.descricao = descricao;
        this.tipo = tipo;
        this.categoria = categoria;
        this.beneficiario = beneficiario;
        this.vencimento = vencimento;
        this.pagamento = pagamento;
        this.valor = valor;
        this.valorPago = valorPago;
        this.saldo = saldo;
        this.status = status;
        this.formaPagamento = formaPagamento;
    }

    public String getDescricao() { return descricao; }
    public String getTipo() { return tipo; }
    public String getCategoria() { return categoria; }
    public String getBeneficiario() { return beneficiario; }
    public String getVencimento() { return vencimento; }
    public String getPagamento() { return pagamento; }
    public String getValor() { return valor; }
    public String getValorPago() { return valorPago; }
    public String getSaldo() { return saldo; }
    public String getStatus() { return status; }
    public String getFormaPagamento() { return formaPagamento; }

    public void setDescricao(String v) { this.descricao = v; }
    public void setTipo(String v) { this.tipo = v; }
    public void setCategoria(String v) { this.categoria = v; }
    public void setBeneficiario(String v) { this.beneficiario = v; }
    public void setVencimento(String v) { this.vencimento = v; }
    public void setPagamento(String v) { this.pagamento = v; }
    public void setValor(String v) { this.valor = v; }
    public void setValorPago(String v) { this.valorPago = v; }
    public void setSaldo(String v) { this.saldo = v; }
    public void setStatus(String v) { this.status = v; }
    public void setFormaPagamento(String v) { this.formaPagamento = v; }
}
