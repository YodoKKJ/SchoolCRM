package com.dom.schoolcrm.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "series")
public class Serie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @OneToMany(mappedBy = "serie", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Turma> turmas = new ArrayList<>();

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public List<Turma> getTurmas() { return turmas; }
    public void setId(Long id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
    public void setTurmas(List<Turma> turmas) { this.turmas = turmas; }
}