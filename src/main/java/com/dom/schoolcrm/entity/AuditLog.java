package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(name = "usuario_login")
    private String usuarioLogin;

    @Column(name = "usuario_role")
    private String usuarioRole;

    private String acao;       // "CRIAR", "EDITAR", "EXCLUIR", "BAIXAR", "LANCAR"
    private String entidade;   // "NOTA", "PRESENCA", "AVALIACAO", "CP", "CR", "USUARIO", "COMUNICADO"

    @Column(name = "entidade_id")
    private String entidadeId;

    @Column(columnDefinition = "TEXT")
    private String detalhes;

    private LocalDateTime timestamp;

    public Long getId() { return id; }
    public Long getUsuarioId() { return usuarioId; }
    public String getUsuarioLogin() { return usuarioLogin; }
    public String getUsuarioRole() { return usuarioRole; }
    public String getAcao() { return acao; }
    public String getEntidade() { return entidade; }
    public String getEntidadeId() { return entidadeId; }
    public String getDetalhes() { return detalhes; }
    public LocalDateTime getTimestamp() { return timestamp; }

    public void setId(Long id) { this.id = id; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public void setUsuarioLogin(String usuarioLogin) { this.usuarioLogin = usuarioLogin; }
    public void setUsuarioRole(String usuarioRole) { this.usuarioRole = usuarioRole; }
    public void setAcao(String acao) { this.acao = acao; }
    public void setEntidade(String entidade) { this.entidade = entidade; }
    public void setEntidadeId(String entidadeId) { this.entidadeId = entidadeId; }
    public void setDetalhes(String detalhes) { this.detalhes = detalhes; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
