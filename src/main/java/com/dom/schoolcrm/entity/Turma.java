package com.dom.schoolcrm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "turmas")
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "escola_id")
    private Long escolaId;

    private String nome;

    @ManyToOne
    @JoinColumn(name = "serie_id")
    private Serie serie;

    @Column(name = "ano_letivo")
    private Integer anoLetivo;

    public Long getId() { return id; }
    public Long getEscolaId() { return escolaId; }
    public void setEscolaId(Long escolaId) { this.escolaId = escolaId; }
    public String getNome() { return nome; }
    public Serie getSerie() { return serie; }
    public Integer getAnoLetivo() { return anoLetivo; }
    public void setId(Long id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
    public void setSerie(Serie serie) { this.serie = serie; }
    public void setAnoLetivo(Integer anoLetivo) { this.anoLetivo = anoLetivo; }

}