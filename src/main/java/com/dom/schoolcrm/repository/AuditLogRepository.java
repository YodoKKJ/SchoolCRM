package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query(value = "SELECT * FROM audit_log WHERE timestamp >= :dataInicio AND timestamp <= :dataFim ORDER BY timestamp DESC",
           nativeQuery = true)
    List<AuditLog> buscar(@org.springframework.data.repository.query.Param("dataInicio") LocalDateTime dataInicio,
                          @org.springframework.data.repository.query.Param("dataFim") LocalDateTime dataFim);
}
