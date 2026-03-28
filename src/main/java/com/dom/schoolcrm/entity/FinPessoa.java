package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Cadastro unificado de pessoas físicas e jurídicas do módulo financeiro.
 * Cobre: responsáveis de alunos, funcionários, fornecedores e empresas.
 * O vínculo com um usuário de sistema (campo usuario) é opcional.
 */
@Entity
@Table(name = "fin_pessoas")
public class FinPessoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "escola_id")
    private Long escolaId;

    // FISICA | JURIDICA
    @Column(name = "tipo_pessoa", nullable = false, length = 10)
    private String tipoPessoa;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true)
    private String cpf;

    @Column(unique = true)
    private String cnpj;

    private String email;
    private String telefone;
    private String endereco;
    private String cep;
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    // Vínculo opcional com usuário de login do sistema
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    private Boolean ativo = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    private void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getEscolaId() { return escolaId; }
    public void setEscolaId(Long escolaId) { this.escolaId = escolaId; }
    public String getTipoPessoa() { return tipoPessoa; }
    public String getNome() { return nome; }
    public String getCpf() { return cpf; }
    public String getCnpj() { return cnpj; }
    public String getEmail() { return email; }
    public String getTelefone() { return telefone; }
    public String getEndereco() { return endereco; }
    public String getCep() { return cep; }
    public String getCidade() { return cidade; }
    public String getEstado() { return estado; }
    public String getObservacoes() { return observacoes; }
    public Usuario getUsuario() { return usuario; }
    public Boolean getAtivo() { return ativo; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setTipoPessoa(String tipoPessoa) { this.tipoPessoa = tipoPessoa; }
    public void setNome(String nome) { this.nome = nome; }
    public void setCpf(String cpf) { this.cpf = cpf; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }
    public void setEmail(String email) { this.email = email; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public void setEndereco(String endereco) { this.endereco = endereco; }
    public void setCep(String cep) { this.cep = cep; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public void setEstado(String estado) { this.estado = estado; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
