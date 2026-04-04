package com.dom.schoolcrm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "escolas")
public class Escola {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String slug;

    private String cnpj;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(name = "cor_primaria")
    private String corPrimaria;

    @Column(name = "cor_secundaria")
    private String corSecundaria;

    @Column(name = "logo_url")
    private String logoUrl;

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getSlug() { return slug; }
    public String getCnpj() { return cnpj; }
    public Boolean getAtivo() { return ativo; }
    public String getCorPrimaria() { return corPrimaria; }
    public String getCorSecundaria() { return corSecundaria; }
    public String getLogoUrl() { return logoUrl; }

    public void setId(Long id) { this.id = id; }
    public void setNome(String nome) { this.nome = nome; }
    public void setSlug(String slug) { this.slug = slug; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public void setCorPrimaria(String corPrimaria) { this.corPrimaria = corPrimaria; }
    public void setCorSecundaria(String corSecundaria) { this.corSecundaria = corSecundaria; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
}
