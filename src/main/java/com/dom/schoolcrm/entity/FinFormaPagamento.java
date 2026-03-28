package com.dom.schoolcrm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "fin_formas_pagamento")
public class FinFormaPagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "escola_id")
    private Long escolaId;

    @Column(nullable = false, unique = true)
    private String nome;

    private Boolean ativo = true;

    public Long getId() { return id; }
    public Long getEscolaId() { return escolaId; }
    public void setEscolaId(Long escolaId) { this.escolaId = escolaId; }
    public String getNome() { return nome; }
    public Boolean getAtivo() { return ativo; }

    public void setId(Long id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
