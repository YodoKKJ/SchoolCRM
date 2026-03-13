package com.dom.schoolcrm.controller;

import com.dom.schoolcrm.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/audit")
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping
    @PreAuthorize("hasRole('DIRECAO')")
    public ResponseEntity<?> listar(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDateTime dataFrom;
        LocalDateTime dataTo;
        try {
            dataFrom = from != null ? LocalDate.parse(from).atStartOfDay() : null;
            dataTo   = to   != null ? LocalDate.parse(to).atTime(23, 59, 59) : null;
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Formato de data inválido. Use YYYY-MM-DD.");
        }
        return ResponseEntity.ok(auditLogRepository.buscar(dataFrom, dataTo));
    }
}
