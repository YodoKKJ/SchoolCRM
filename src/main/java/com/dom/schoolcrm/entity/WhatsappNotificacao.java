package com.dom.schoolcrm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Log imutável de notificações WhatsApp enviadas.
 * Evita duplicatas (mesmo boleto + mesmo tipo no mesmo dia)
 * e permite auditoria completa do que foi enviado.
 */
@Entity
@Table(name = "whatsapp_notificacoes",
       indexes = {
           @Index(name = "idx_whatsapp_notif_cr", columnList = "conta_receber_id"),
           @Index(name = "idx_whatsapp_notif_data", columnList = "enviado_em")
       })
public class WhatsappNotificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Conta a receber que gerou a notificação
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conta_receber_id", nullable = false)
    private FinContaReceber contaReceber;

    // Pessoa que recebeu a mensagem (responsável)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private FinPessoa pessoa;

    // Telefone usado no envio (snapshot — telefone pode mudar depois)
    @Column(nullable = false, length = 30)
    private String telefone;

    // LEMBRETE_PRIMEIRO | LEMBRETE_SEGUNDO | VENCIDO | MANUAL
    @Column(nullable = false, length = 30)
    private String tipo;

    // Mensagem efetivamente enviada
    @Column(columnDefinition = "TEXT")
    private String mensagem;

    // ENVIADO | ERRO
    @Column(nullable = false, length = 20)
    private String status;

    // Detalhes do erro, se houver
    @Column(name = "erro_detalhe", columnDefinition = "TEXT")
    private String erroDetalhe;

    @Column(name = "enviado_em", nullable = false)
    private LocalDateTime enviadoEm;

    @PrePersist
    private void prePersist() {
        this.enviadoEm = LocalDateTime.now();
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public FinContaReceber getContaReceber() { return contaReceber; }
    public void setContaReceber(FinContaReceber contaReceber) { this.contaReceber = contaReceber; }

    public FinPessoa getPessoa() { return pessoa; }
    public void setPessoa(FinPessoa pessoa) { this.pessoa = pessoa; }

    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErroDetalhe() { return erroDetalhe; }
    public void setErroDetalhe(String erroDetalhe) { this.erroDetalhe = erroDetalhe; }

    public LocalDateTime getEnviadoEm() { return enviadoEm; }
    public void setEnviadoEm(LocalDateTime enviadoEm) { this.enviadoEm = enviadoEm; }
}
