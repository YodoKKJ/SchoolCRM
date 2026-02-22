package com.dom.schoolcrm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "professor_turma_materia")
public class ProfessorTurmaMateria {

    @EmbeddedId
    private ProfessorTurmaMateriaId id = new ProfessorTurmaMateriaId();

    @ManyToOne
    @MapsId("professorId")
    @JoinColumn(name = "professor_id")
    private Usuario professor;

    @ManyToOne
    @MapsId("turmaId")
    @JoinColumn(name = "turma_id")
    private Turma turma;

    @ManyToOne
    @MapsId("materiaId")
    @JoinColumn(name = "materia_id")
    private Materia materia;

    public ProfessorTurmaMateriaId getId() { return id; }
    public Usuario getProfessor() { return professor; }
    public Turma getTurma() { return turma; }
    public Materia getMateria() { return materia; }
    public void setId(ProfessorTurmaMateriaId id) { this.id = id; }
    public void setProfessor(Usuario professor) { this.professor = professor; }
    public void setTurma(Turma turma) { this.turma = turma; }
    public void setMateria(Materia materia) { this.materia = materia; }
}