package com.dom.schoolcrm.service;

import com.dom.schoolcrm.entity.FinConfiguracao;
import com.dom.schoolcrm.repository.FinConfiguracaoRepository;
import com.dom.schoolcrm.security.TenantContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Serviço singleton de configuração financeira/acadêmica.
 * Usa Spring Cache para evitar múltiplas consultas ao banco
 * por requisição (findAll() era chamado N vezes em cada endpoint).
 * O cache é evicted automaticamente sempre que a config é salva.
 *
 * Tenant-aware: cada escola tem sua própria configuração.
 * MASTER (escolaId = null) vê a config global (primeiro registro).
 */
@Service
public class FinConfiguracaoService {

    @Autowired
    private FinConfiguracaoRepository repository;

    @Cacheable("finConfig")
    public FinConfiguracao getConfig() {
        Long escolaId = TenantContext.getEscolaId();
        if (escolaId != null) {
            return repository.findByEscolaId(escolaId)
                    .orElseGet(() -> criarDefault(escolaId));
        }
        return repository.findAll().stream().findFirst()
                .orElseGet(() -> criarDefault(null));
    }

    @CacheEvict(value = "finConfig", allEntries = true)
    public FinConfiguracao save(FinConfiguracao config) {
        return repository.save(config);
    }

    public double getMediaMinima() {
        FinConfiguracao c = getConfig();
        return c.getMediaMinima() != null ? c.getMediaMinima().doubleValue() : 6.0;
    }

    public double getFreqMinima() {
        FinConfiguracao c = getConfig();
        return c.getFreqMinima() != null ? c.getFreqMinima().doubleValue() : 75.0;
    }

    private FinConfiguracao criarDefault(Long escolaId) {
        FinConfiguracao config = new FinConfiguracao();
        config.setNumParcelasPadrao(12);
        config.setDiaVencimentoPadrao(10);
        config.setJurosAtrasoPct(new BigDecimal("1.00"));
        config.setMultaAtrasoPct(new BigDecimal("2.00"));
        config.setMediaMinima(new BigDecimal("6.00"));
        config.setFreqMinima(new BigDecimal("75.00"));
        if (escolaId != null) config.setEscolaId(escolaId);
        return repository.save(config);
    }
}
