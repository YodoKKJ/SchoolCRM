package com.dom.schoolcrm.repository;

import com.dom.schoolcrm.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE (:from IS NULL OR a.timestamp >= :from) AND (:to IS NULL OR a.timestamp <= :to) ORDER BY a.timestamp DESC")
    List<AuditLog> buscar(@org.springframework.data.repository.query.Param("from") LocalDateTime from,
                          @org.springframework.data.repository.query.Param("to") LocalDateTime to);
}
