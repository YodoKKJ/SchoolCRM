package com.dom.schoolcrm.entity;

import jakarta.persistence.*;

/**
 * Vínculo entre um responsável financeiro (FinPessoa) e um aluno (Usuario).
 * Regras:
 *  - Cada aluno tem exatamente 1 responsável PRINCIPAL e no máximo 1 SECUNDARIO.
 *  - A combinação (pessoa_id, aluno_id) deve ser única.
 */
@Entity
@Table(name = "fin_responsavel_aluno",
       uniqueConstraints = @UniqueConstraint(columnNames = {"pessoa_id", "aluno_id"}))
public class FinResponsavelAluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pessoa_id", nullable = false)
    private FinPessoa pessoa;

    // Referência ao aluno (Usuario com role ALUNO)
    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Usuario aluno;

    // PRINCIPAL | SECUNDARIO
    @Column(nullable = false, length = 20)
    private String tipo;

    // PAI | MAE | AVO | TIO | RESPONSAVEL | OUTRO
    @Column(length = 50)
    private String parentesco;

    public Long getId() { return id; }
    public FinPessoa getPessoa() { return pessoa; }
    public Usuario getAluno() { return aluno; }
    public String getTipo() { return tipo; }
    public String getParentesco() { return parentesco; }

    public void setId(Long id) { this.id = id; }
    public void setPessoa(FinPessoa pessoa) { this.pessoa = pessoa; }
    public void setAluno(Usuario aluno) { this.aluno = aluno; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public void setParentesco(String parentesco) { this.parentesco = parentesco; }
}
