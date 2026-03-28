package com.dom.schoolcrm.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "usuarios", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"login", "escola_id"})
})
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String login;

    @JsonIgnore
    @Column(name = "senha_hash")
    private String senhaHash;

    private String role;
    private Boolean ativo;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escola_id")
    private Escola escola;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    @Column(name = "nome_pai")
    private String nomePai;

    @Column(name = "nome_mae")
    private String nomeMae;

    private String telefone;

    // Getters e Setters
    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getLogin() { return login; }
    public String getSenhaHash() { return senhaHash; }
    public String getRole() { return role; }
    public Boolean getAtivo() { return ativo; }
    public Escola getEscola() { return escola; }
    public LocalDate getDataNascimento() { return dataNascimento; }
    public String getNomePai() { return nomePai; }
    public String getNomeMae() { return nomeMae; }
    public String getTelefone() { return telefone; }

    public void setId(Long id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
    public void setLogin(String login) { this.login = login; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public void setRole(String role) { this.role = role; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public void setEscola(Escola escola) { this.escola = escola; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }
    public void setNomePai(String nomePai) { this.nomePai = nomePai; }
    public void setNomeMae(String nomeMae) { this.nomeMae = nomeMae; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
}