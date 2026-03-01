package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Dados financeiros/trabalhistas de um funcionário.
 * Sempre vinculado a uma FinPessoa (que pode ou não ter login no sistema).
 */
@Entity
@Table(name = "fin_funcionarios")
public class FinFuncionario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pessoa_id", nullable = false)
    private FinPessoa pessoa;

    @Column(nullable = false)
    private String cargo;

    // Horas semanais (ex: 40.00)
    @Column(name = "carga_horaria", precision = 5, scale = 2)
    private BigDecimal cargaHoraria;

    @Column(name = "salario_base", nullable = false, precision = 10, scale = 2)
    private BigDecimal salarioBase;

    @Column(name = "data_admissao")
    private LocalDate dataAdmissao;

    @Column(name = "data_demissao")
    private LocalDate dataDemissao;

    private Boolean ativo = true;

    public Long getId() { return id; }
    public FinPessoa getPessoa() { return pessoa; }
    public String getCargo() { return cargo; }
    public BigDecimal getCargaHoraria() { return cargaHoraria; }
    public BigDecimal getSalarioBase() { return salarioBase; }
    public LocalDate getDataAdmissao() { return dataAdmissao; }
    public LocalDate getDataDemissao() { return dataDemissao; }
    public Boolean getAtivo() { return ativo; }

    public void setId(Long id) { this.id = id; }
    public void setPessoa(FinPessoa pessoa) { this.pessoa = pessoa; }
    public void setCargo(String cargo) { this.cargo = cargo; }
    public void setCargaHoraria(BigDecimal cargaHoraria) { this.cargaHoraria = cargaHoraria; }
    public void setSalarioBase(BigDecimal salarioBase) { this.salarioBase = salarioBase; }
    public void setDataAdmissao(LocalDate dataAdmissao) { this.dataAdmissao = dataAdmissao; }
    public void setDataDemissao(LocalDate dataDemissao) { this.dataDemissao = dataDemissao; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
