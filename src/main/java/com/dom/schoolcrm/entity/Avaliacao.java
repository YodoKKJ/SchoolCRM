package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "avaliacoes")
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "turma_id")
    private Turma turma;

    @ManyToOne
    @JoinColumn(name = "materia_id")
    private Materia materia;

    private String tipo;
    private String descricao;

    @Column(name = "data_aplicacao")
    private LocalDate dataAplicacao;

    private BigDecimal peso;

    private Boolean bonificacao;

    public Long getId() { return id; }
    public Turma getTurma() { return turma; }
    public Materia getMateria() { return materia; }
    public String getTipo() { return tipo; }
    public String getDescricao() { return descricao; }
    public LocalDate getDataAplicacao() { return dataAplicacao; }
    public BigDecimal getPeso() { return peso; }
    public Boolean getBonificacao() { return bonificacao; }

    public void setId(Long id) { this.id = id; }
    public void setTurma(Turma turma) { this.turma = turma; }
    public void setMateria(Materia materia) { this.materia = materia; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public void setDataAplicacao(LocalDate dataAplicacao) { this.dataAplicacao = dataAplicacao; }
    public void setPeso(BigDecimal peso) { this.peso = peso; }
    public void setBonificacao(Boolean bonificacao) { this.bonificacao = bonificacao; }
}