package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "presencas")
public class Presenca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    private Usuario aluno;

    @ManyToOne
    @JoinColumn(name = "turma_id")
    private Turma turma;

    @ManyToOne
    @JoinColumn(name = "materia_id")
    private Materia materia;

    private LocalDate data;
    private Boolean presente;

    public Long getId() { return id; }
    public Usuario getAluno() { return aluno; }
    public Turma getTurma() { return turma; }
    public Materia getMateria() { return materia; }
    public LocalDate getData() { return data; }
    public Boolean getPresente() { return presente; }
    public void setId(Long id) { this.id = id; }
    public void setAluno(Usuario aluno) { this.aluno = aluno; }
    public void setTurma(Turma turma) { this.turma = turma; }
    public void setMateria(Materia materia) { this.materia = materia; }
    public void setData(LocalDate data) { this.data = data; }
    public void setPresente(Boolean presente) { this.presente = presente; }
}