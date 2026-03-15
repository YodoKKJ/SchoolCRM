package com.dom.schoolcrm.dto.relatorio.fin;

import java.math.BigDecimal;

/**
 * Linha do relatório de Folha de Pagamento.
 */
public class FinFolhaItemDTO {

    private String funcionarioNome;
    private String cargo;
    private String cargaHoraria;
    private String salarioBase;
    private String beneficios;      // descrição resumida dos benefícios ativos
    private String totalBruto;
    private BigDecimal totalBrutoDouble; // para soma no rodapé do JRXML

    public FinFolhaItemDTO() {}

    public FinFolhaItemDTO(String funcionarioNome, String cargo, String cargaHoraria,
                            String salarioBase, String beneficios,
                            String totalBruto, BigDecimal totalBrutoDouble) {
        this.funcionarioNome = funcionarioNome;
        this.cargo = cargo;
        this.cargaHoraria = cargaHoraria;
        this.salarioBase = salarioBase;
        this.beneficios = beneficios;
        this.totalBruto = totalBruto;
        this.totalBrutoDouble = totalBrutoDouble;
    }

    public String getFuncionarioNome() { return funcionarioNome; }
    public String getCargo() { return cargo; }
    public String getCargaHoraria() { return cargaHoraria; }
    public String getSalarioBase() { return salarioBase; }
    public String getBeneficios() { return beneficios; }
    public String getTotalBruto() { return totalBruto; }
    public BigDecimal getTotalBrutoDouble() { return totalBrutoDouble; }

    public void setFuncionarioNome(String v) { this.funcionarioNome = v; }
    public void setCargo(String v) { this.cargo = v; }
    public void setCargaHoraria(String v) { this.cargaHoraria = v; }
    public void setSalarioBase(String v) { this.salarioBase = v; }
    public void setBeneficios(String v) { this.beneficios = v; }
    public void setTotalBruto(String v) { this.totalBruto = v; }
    public void setTotalBrutoDouble(BigDecimal v) { this.totalBrutoDouble = v; }
}
