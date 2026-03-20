package com.dom.schoolcrm.dto.relatorio.fin;

/**
 * Linha do relatório de Fluxo de Caixa.
 * Agrega CR recebidas + CP pagas + movimentações avulsas no período.
 */
public class FinFluxoCaixaItemDTO {

    private String data;
    private String descricao;
    private String tipo;        // ENTRADA | SAIDA
    private String origem;      // CR | CP | MOVIMENTACAO
    private String categoria;
    private String valor;
    private String formaPagamento;

    public FinFluxoCaixaItemDTO() {}

    public FinFluxoCaixaItemDTO(String data, String descricao, String tipo, String origem,
                                 String categoria, String valor, String formaPagamento) {
        this.data = data;
        this.descricao = descricao;
        this.tipo = tipo;
        this.origem = origem;
        this.categoria = categoria;
        this.valor = valor;
        this.formaPagamento = formaPagamento;
    }

    public String getData() { return data; }
    public String getDescricao() { return descricao; }
    public String getTipo() { return tipo; }
    public String getOrigem() { return origem; }
    public String getCategoria() { return categoria; }
    public String getValor() { return valor; }
    public String getFormaPagamento() { return formaPagamento; }

    public void setData(String v) { this.data = v; }
    public void setDescricao(String v) { this.descricao = v; }
    public void setTipo(String v) { this.tipo = v; }
    public void setOrigem(String v) { this.origem = v; }
    public void setCategoria(String v) { this.categoria = v; }
    public void setValor(String v) { this.valor = v; }
    public void setFormaPagamento(String v) { this.formaPagamento = v; }
}
