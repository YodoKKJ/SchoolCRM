package com.dom.schoolcrm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "horarios")
public class Horario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "turma_id")
    private Turma turma;

    @ManyToOne
    @JoinColumn(name = "materia_id")
    private Materia materia;

    @ManyToOne
    @JoinColumn(name = "professor_id")
    private Usuario professor;

    @Column(name = "dia_semana")
    private String diaSemana; // SEG, TER, QUA, QUI, SEX

    @Column(name = "horario_inicio")
    private String horarioInicio; // "07:30", "08:18", etc.

    @Column(name = "ordem_aula")
    private Integer ordemAula; // 1, 2, 3, 4, 5

    public Long getId() { return id; }
    public Turma getTurma() { return turma; }
    public Materia getMateria() { return materia; }
    public Usuario getProfessor() { return professor; }
    public String getDiaSemana() { return diaSemana; }
    public String getHorarioInicio() { return horarioInicio; }
    public Integer getOrdemAula() { return ordemAula; }

    public void setId(Long id) { this.id = id; }
    public void setTurma(Turma turma) { this.turma = turma; }
    public void setMateria(Materia materia) { this.materia = materia; }
    public void setProfessor(Usuario professor) { this.professor = professor; }
    public void setDiaSemana(String diaSemana) { this.diaSemana = diaSemana; }
    public void setHorarioInicio(String horarioInicio) { this.horarioInicio = horarioInicio; }
    public void setOrdemAula(Integer ordemAula) { this.ordemAula = ordemAula; }
}
