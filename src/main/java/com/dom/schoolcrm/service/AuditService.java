package com.dom.schoolcrm.service;

import com.dom.schoolcrm.entity.AuditLog;
import com.dom.schoolcrm.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository repo;

    public void log(Authentication auth, String acao, String entidade, String entidadeId, String detalhes) {
        if (auth == null) return;
        AuditLog log = new AuditLog();
        log.setUsuarioLogin(auth.getName());
        log.setUsuarioRole(auth.getAuthorities().stream().findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", "")).orElse("?"));
        log.setAcao(acao);
        log.setEntidade(entidade);
        log.setEntidadeId(entidadeId);
        log.setDetalhes(detalhes);
        log.setTimestamp(LocalDateTime.now());
        repo.save(log);
    }
}
