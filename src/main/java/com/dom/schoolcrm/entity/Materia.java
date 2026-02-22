package com.dom.schoolcrm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "materias")
public class Materia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public void setId(Long id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
}