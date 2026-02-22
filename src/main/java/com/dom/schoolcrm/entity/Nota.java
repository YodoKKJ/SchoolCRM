package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "notas")
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "avaliacao_id")
    private Avaliacao avaliacao;

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    private Usuario aluno;

    private BigDecimal valor;

    @Column(name = "lancado_em")
    private LocalDateTime lancadoEm;

    public Long getId() { return id; }
    public Avaliacao getAvaliacao() { return avaliacao; }
    public Usuario getAluno() { return aluno; }
    public BigDecimal getValor() { return valor; }
    public LocalDateTime getLancadoEm() { return lancadoEm; }
    public void setId(Long id) { this.id = id; }
    public void setAvaliacao(Avaliacao avaliacao) { this.avaliacao = avaliacao; }
    public void setAluno(Usuario aluno) { this.aluno = aluno; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
    public void setLancadoEm(LocalDateTime lancadoEm) { this.lancadoEm = lancadoEm; }
}