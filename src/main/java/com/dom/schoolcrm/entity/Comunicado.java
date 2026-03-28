package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comunicados")
public class Comunicado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "escola_id")
    private Long escolaId;

    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String corpo;

    @Column(name = "autor_id")
    private Long autorId;

    @Column(name = "autor_nome")
    private String autorNome;

    @Column(name = "autor_role")
    private String autorRole;

    @Column(name = "data_publicacao")
    private LocalDateTime dataPublicacao;

    private String destinatarios; // "TODOS", "PROFESSORES", "ALUNOS", "TURMA"

    @Column(name = "turma_id")
    private Long turmaId; // só preenchido quando destinatarios = "TURMA"

    private Boolean ativo = true;

    public Long getId() { return id; }
    public Long getEscolaId() { return escolaId; }
    public void setEscolaId(Long escolaId) { this.escolaId = escolaId; }
    public String getTitulo() { return titulo; }
    public String getCorpo() { return corpo; }
    public Long getAutorId() { return autorId; }
    public String getAutorNome() { return autorNome; }
    public String getAutorRole() { return autorRole; }
    public LocalDateTime getDataPublicacao() { return dataPublicacao; }
    public String getDestinatarios() { return destinatarios; }
    public Boolean getAtivo() { return ativo; }
    public Long getTurmaId() { return turmaId; }

    public void setId(Long id) { this.id = id; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public void setCorpo(String corpo) { this.corpo = corpo; }
    public void setAutorId(Long autorId) { this.autorId = autorId; }
    public void setAutorNome(String autorNome) { this.autorNome = autorNome; }
    public void setAutorRole(String autorRole) { this.autorRole = autorRole; }
    public void setDataPublicacao(LocalDateTime dataPublicacao) { this.dataPublicacao = dataPublicacao; }
    public void setDestinatarios(String destinatarios) { this.destinatarios = destinatarios; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public void setTurmaId(Long turmaId) { this.turmaId = turmaId; }
}
