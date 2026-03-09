package com.dom.schoolcrm.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Remove constraints legados que bloqueiam o tipo RECUPERACAO na tabela avaliacoes.
 * Roda uma vez na inicialização — idempotente (IF EXISTS).
 */
@Component
public class SchemaMigration {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrate() {
        // 1. Drop qualquer CHECK constraint na tabela avaliacoes
        try {
            jdbcTemplate.execute(
                "DO $$ DECLARE r RECORD; BEGIN " +
                "  FOR r IN SELECT constraint_name FROM information_schema.table_constraints " +
                "            WHERE table_name = 'avaliacoes' AND constraint_type = 'CHECK' " +
                "  LOOP " +
                "    EXECUTE 'ALTER TABLE avaliacoes DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name); " +
                "  END LOOP; " +
                "END $$;"
            );
        } catch (Exception ignored) {}

        // 2. Garante colunas de presença por período (ddl-auto=update pode falhar silenciosamente no Railway)
        try {
            jdbcTemplate.execute(
                "ALTER TABLE presencas ADD COLUMN IF NOT EXISTS ordem_aula INTEGER;"
            );
        } catch (Exception ignored) {}

        try {
            jdbcTemplate.execute(
                "ALTER TABLE presencas ADD COLUMN IF NOT EXISTS horario_inicio VARCHAR(255);"
            );
        } catch (Exception ignored) {}
    }
}
