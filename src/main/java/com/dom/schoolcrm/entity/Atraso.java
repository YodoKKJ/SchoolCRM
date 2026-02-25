package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "atrasos")
public class Atraso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    private Usuario aluno;

    @ManyToOne
    @JoinColumn(name = "turma_id")
    private Turma turma;

    @Column(name = "registrado_em")
    private LocalDateTime registradoEm;

    @Column(name = "observacao")
    private String observacao;

    public Long getId() { return id; }
    public Usuario getAluno() { return aluno; }
    public Turma getTurma() { return turma; }
    public LocalDateTime getRegistradoEm() { return registradoEm; }
    public String getObservacao() { return observacao; }

    public void setId(Long id) { this.id = id; }
    public void setAluno(Usuario aluno) { this.aluno = aluno; }
    public void setTurma(Turma turma) { this.turma = turma; }
    public void setRegistradoEm(LocalDateTime registradoEm) { this.registradoEm = registradoEm; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
}
