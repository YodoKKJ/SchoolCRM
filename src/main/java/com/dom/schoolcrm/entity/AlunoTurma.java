package com.dom.schoolcrm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "aluno_turma")
public class AlunoTurma {

    @EmbeddedId
    private AlunoTurmaId id = new AlunoTurmaId();

    @ManyToOne
    @MapsId("alunoId")
    @JoinColumn(name = "aluno_id")
    private Usuario aluno;

    @ManyToOne
    @MapsId("turmaId")
    @JoinColumn(name = "turma_id")
    private Turma turma;

    public AlunoTurmaId getId() { return id; }
    public Usuario getAluno() { return aluno; }
    public Turma getTurma() { return turma; }
    public void setId(AlunoTurmaId id) { this.id = id; }
    public void setAluno(Usuario aluno) { this.aluno = aluno; }
    public void setTurma(Turma turma) { this.turma = turma; }
}