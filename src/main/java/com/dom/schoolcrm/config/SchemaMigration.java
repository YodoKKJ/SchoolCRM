package com.dom.schoolcrm.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Migrações de schema idempotentes executadas na inicialização.
 * Cobre casos em que ddl-auto=update falha silenciosamente no Railway.
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

        // 2. Garante colunas de presenca por periodo (ddl-auto=update pode falhar silenciosamente no Railway)
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

        // 3. Remove UNIQUE constraints antigas em presencas que bloqueiam multiplos periodos no mesmo dia
        try {
            jdbcTemplate.execute(
                "DO $$ DECLARE r RECORD; BEGIN " +
                "  FOR r IN SELECT constraint_name FROM information_schema.table_constraints " +
                "            WHERE table_name = 'presencas' AND constraint_type = 'UNIQUE' " +
                "  LOOP " +
                "    EXECUTE 'ALTER TABLE presencas DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name); " +
                "  END LOOP; " +
                "END $$;"
            );
        } catch (Exception ignored) {}

        // 4. Tabela de histórico de pagamentos de Contas a Pagar (CP)
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS fin_historico_pagamento_cp (
                    id BIGSERIAL PRIMARY KEY,
                    conta_pagar_id BIGINT NOT NULL REFERENCES fin_contas_pagar(id),
                    data_registro TIMESTAMP NOT NULL,
                    data_pagamento DATE NOT NULL,
                    valor_pago NUMERIC(10,2) NOT NULL,
                    forma_pagamento_id BIGINT REFERENCES fin_formas_pagamento(id),
                    juros_aplicado NUMERIC(10,2),
                    multa_aplicada NUMERIC(10,2),
                    observacoes TEXT
                );
                """);
        } catch (Exception ignored) {}

        // 5. Colunas de versionamento de grade horária (historico de horarios)
        try {
            jdbcTemplate.execute(
                "ALTER TABLE horarios ADD COLUMN IF NOT EXISTS data_inicio_vigencia DATE;"
            );
        } catch (Exception ignored) {}

        try {
            jdbcTemplate.execute(
                "ALTER TABLE horarios ADD COLUMN IF NOT EXISTS data_fim_vigencia DATE;"
            );
        } catch (Exception ignored) {}

        // Drop CHECK constraint em usuarios.role para aceitar COORDENACAO
        try {
            jdbcTemplate.execute(
                "DO $$ DECLARE r RECORD; BEGIN " +
                "  FOR r IN SELECT constraint_name FROM information_schema.table_constraints " +
                "            WHERE table_name = 'usuarios' AND constraint_type = 'CHECK' " +
                "  LOOP " +
                "    EXECUTE 'ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name); " +
                "  END LOOP; " +
                "END $$;"
            );
        } catch (Exception ignored) {}

        // Feature 10: Comunicados
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS comunicados (
                    id BIGSERIAL PRIMARY KEY,
                    titulo VARCHAR(255) NOT NULL,
                    corpo TEXT,
                    autor_id BIGINT,
                    autor_nome VARCHAR(255),
                    autor_role VARCHAR(50),
                    data_publicacao TIMESTAMP NOT NULL,
                    destinatarios VARCHAR(50) NOT NULL DEFAULT 'TODOS',
                    ativo BOOLEAN NOT NULL DEFAULT TRUE
                );
                """);
        } catch (Exception ignored) {}

        // Feature 10 patch: coluna turma_id em comunicados (para comunicados por turma)
        try {
            jdbcTemplate.execute("ALTER TABLE comunicados ADD COLUMN IF NOT EXISTS turma_id BIGINT;");
        } catch (Exception ignored) {}

        // Feature 11: Critérios configuráveis de aprovação
        try {
            jdbcTemplate.execute("ALTER TABLE fin_configuracoes ADD COLUMN IF NOT EXISTS media_minima NUMERIC(4,2) DEFAULT 6.0;");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE fin_configuracoes ADD COLUMN IF NOT EXISTS freq_minima NUMERIC(4,2) DEFAULT 75.0;");
        } catch (Exception ignored) {}

        // Feature 12: Log de auditoria
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id BIGSERIAL PRIMARY KEY,
                    usuario_id BIGINT,
                    usuario_login VARCHAR(255),
                    usuario_role VARCHAR(50),
                    acao VARCHAR(50),
                    entidade VARCHAR(100),
                    entidade_id VARCHAR(255),
                    detalhes TEXT,
                    timestamp TIMESTAMP NOT NULL
                );
                """);
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);");
        } catch (Exception ignored) {}
    }
}
