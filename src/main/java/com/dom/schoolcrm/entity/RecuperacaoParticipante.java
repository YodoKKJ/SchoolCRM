package com.dom.schoolcrm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "recuperacao_participantes")
public class RecuperacaoParticipante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "avaliacao_id")
    private Avaliacao avaliacao;

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    private Usuario aluno;

    public Long getId() { return id; }
    public Avaliacao getAvaliacao() { return avaliacao; }
    public Usuario getAluno() { return aluno; }
    public void setId(Long id) { this.id = id; }
    public void setAvaliacao(Avaliacao avaliacao) { this.avaliacao = avaliacao; }
    public void setAluno(Usuario aluno) { this.aluno = aluno; }
}
