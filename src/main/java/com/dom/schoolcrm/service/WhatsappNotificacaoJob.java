package com.dom.schoolcrm.service;

import com.dom.schoolcrm.entity.FinContaReceber;
import com.dom.schoolcrm.entity.FinContrato;
import com.dom.schoolcrm.entity.FinPessoa;
import com.dom.schoolcrm.entity.WhatsappConfig;
import com.dom.schoolcrm.repository.FinContaReceberRepository;
import com.dom.schoolcrm.repository.WhatsappNotificacaoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Job agendado que verifica contas a receber próximas do vencimento
 * e envia lembretes via WhatsApp para os responsáveis.
 *
 * Roda a cada hora, mas só efetua envio na hora configurada (horaEnvio).
 * Isso permite alterar o horário sem redeployar.
 */
@Component
public class WhatsappNotificacaoJob {

    private static final Logger log = LoggerFactory.getLogger(WhatsappNotificacaoJob.class);

    @Autowired
    private WhatsappService whatsappService;

    @Autowired
    private FinContaReceberRepository contaReceberRepository;

    @Autowired
    private WhatsappNotificacaoRepository notificacaoRepository;

    /**
     * Executa a cada hora cheia. Verifica se é a hora certa e processa.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void verificarEEnviarAgendado() {
        WhatsappConfig config = whatsappService.getConfig();

        if (!Boolean.TRUE.equals(config.getAtivo())) {
            return;
        }

        // Só executa na hora configurada
        int horaAtual = LocalTime.now().getHour();
        int horaConfig = config.getHoraEnvio() != null ? config.getHoraEnvio() : 8;
        if (horaAtual != horaConfig) {
            return;
        }

        executarEnvio(config);
    }

    /**
     * Execução manual via controller — ignora checagem de hora.
     */
    public void verificarEEnviar() {
        WhatsappConfig config = whatsappService.getConfig();

        if (!Boolean.TRUE.equals(config.getAtivo())) {
            throw new IllegalStateException("WhatsApp está desativado. Ative antes de disparar.");
        }

        executarEnvio(config);
    }

    private void executarEnvio(WhatsappConfig config) {
        log.info("=== WhatsApp Job iniciado ===");
        LocalDate hoje = LocalDate.now();
        int enviados = 0, erros = 0;

        // 1. Lembretes de primeiro aviso (X dias antes)
        if (config.getDiasAntesPrimeiro() != null && config.getDiasAntesPrimeiro() > 0) {
            LocalDate dataAlvo = hoje.plusDays(config.getDiasAntesPrimeiro());
            enviados += processarLembretes(dataAlvo, "LEMBRETE_PRIMEIRO");
        }

        // 2. Lembretes de segundo aviso (Y dias antes)
        if (config.getDiasAntesSegundo() != null && config.getDiasAntesSegundo() > 0) {
            LocalDate dataAlvo = hoje.plusDays(config.getDiasAntesSegundo());
            enviados += processarLembretes(dataAlvo, "LEMBRETE_SEGUNDO");
        }

        // 3. Boletos vencidos (se configurado)
        if (Boolean.TRUE.equals(config.getNotificarVencidos())) {
            enviados += processarVencidos(hoje);
        }

        log.info("=== WhatsApp Job finalizado: {} enviados, {} erros ===", enviados, erros);
    }

    /**
     * Processa lembretes para CRs com vencimento em uma data específica.
     */
    private int processarLembretes(LocalDate dataVencimento, String tipo) {
        List<FinContaReceber> crs = contaReceberRepository.findParaNotificacao(
                dataVencimento, dataVencimento);

        int enviados = 0;
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();

        for (FinContaReceber cr : crs) {
            // Pula se já notificou hoje
            if (notificacaoRepository.existsByContaReceberIdAndTipoHoje(cr.getId(), tipo, inicioDia)) {
                continue;
            }

            FinPessoa responsavel = resolverResponsavel(cr);
            if (responsavel == null || responsavel.getTelefone() == null) {
                log.debug("CR #{} sem responsável com telefone, pulando", cr.getId());
                continue;
            }

            if (whatsappService.enviarLembrete(cr, responsavel, tipo)) {
                enviados++;
            }
        }

        log.info("{}: {} CRs para {}, {} enviados", tipo, crs.size(), dataVencimento, enviados);
        return enviados;
    }

    /**
     * Processa notificação de boletos já vencidos (somente uma vez por CR).
     */
    private int processarVencidos(LocalDate hoje) {
        List<FinContaReceber> vencidas = contaReceberRepository.findVencidasParaNotificacao(hoje);

        int enviados = 0;
        LocalDateTime inicioDia = hoje.atStartOfDay();

        for (FinContaReceber cr : vencidas) {
            if (notificacaoRepository.existsByContaReceberIdAndTipoHoje(cr.getId(), "VENCIDO", inicioDia)) {
                continue;
            }

            FinPessoa responsavel = resolverResponsavel(cr);
            if (responsavel == null || responsavel.getTelefone() == null) {
                continue;
            }

            if (whatsappService.enviarLembrete(cr, responsavel, "VENCIDO")) {
                enviados++;
            }
        }

        log.info("VENCIDOS: {} CRs vencidas, {} notificados", vencidas.size(), enviados);
        return enviados;
    }

    /**
     * Resolve o responsável financeiro para uma CR.
     * Para parcelas de contrato → usa responsavelPrincipal do contrato.
     * Para CRs avulsas → usa a pessoa diretamente vinculada.
     */
    private FinPessoa resolverResponsavel(FinContaReceber cr) {
        // Se tem contrato, pega o responsável principal do contrato
        FinContrato contrato = cr.getContrato();
        if (contrato != null && contrato.getResponsavelPrincipal() != null) {
            return contrato.getResponsavelPrincipal();
        }

        // CR avulsa — usa a pessoa diretamente vinculada
        return cr.getPessoa();
    }
}
