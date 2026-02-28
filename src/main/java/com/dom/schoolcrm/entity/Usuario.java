package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String login;

    @Column(name = "senha_hash")
    private String senhaHash;

    private String role;
    private Boolean ativo;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    @Column(name = "nome_pai")
    private String nomePai;

    @Column(name = "nome_mae")
    private String nomeMae;

    // Getters e Setters
    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getLogin() { return login; }
    public String getSenhaHash() { return senhaHash; }
    public String getRole() { return role; }
    public Boolean getAtivo() { return ativo; }
    public LocalDate getDataNascimento() { return dataNascimento; }
    public String getNomePai() { return nomePai; }
    public String getNomeMae() { return nomeMae; }

    public void setId(Long id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
    public void setLogin(String login) { this.login = login; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public void setRole(String role) { this.role = role; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }
    public void setNomePai(String nomePai) { this.nomePai = nomePai; }
    public void setNomeMae(String nomeMae) { this.nomeMae = nomeMae; }
}