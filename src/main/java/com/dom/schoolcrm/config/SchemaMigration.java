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

        // Bug fix: garante singleton em fin_configuracoes — remove duplicatas e adiciona constraint única
        try {
            // Remove duplicatas mantendo apenas o registro com menor id
            jdbcTemplate.execute("DELETE FROM fin_configuracoes WHERE id NOT IN (SELECT MIN(id) FROM fin_configuracoes);");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("ALTER TABLE fin_configuracoes ADD COLUMN IF NOT EXISTS singleton_key VARCHAR(8) NOT NULL DEFAULT 'default';");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("UPDATE fin_configuracoes SET singleton_key = 'default' WHERE singleton_key IS NULL OR singleton_key = '';");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_fin_configuracoes_singleton ON fin_configuracoes(singleton_key);");
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

        // Performance: índices compostos para queries frequentes
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_presencas_aluno_turma_materia ON presencas(aluno_id, turma_id, materia_id);");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_presencas_turma_materia ON presencas(turma_id, materia_id);");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_presencas_aluno_turma ON presencas(aluno_id, turma_id);");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_notas_aluno_id ON notas(aluno_id);");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_aluno_turma_turma_id ON aluno_turma(turma_id);");
        } catch (Exception ignored) {}
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_aluno_turma_aluno_id ON aluno_turma(aluno_id);");
        } catch (Exception ignored) {}

        // Multi-tenant: tabela escolas e vinculação com usuarios
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS escolas (
                    id BIGSERIAL PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NOT NULL UNIQUE,
                    cnpj VARCHAR(20),
                    ativo BOOLEAN NOT NULL DEFAULT TRUE
                );
                """);
        } catch (Exception ignored) {}

        // Cria escola padrão se não existe e vincula todos os usuários órfãos
        try {
            jdbcTemplate.execute("""
                INSERT INTO escolas (nome, slug, ativo)
                SELECT 'Escola Padrão', 'escola-padrao', TRUE
                WHERE NOT EXISTS (SELECT 1 FROM escolas WHERE slug = 'escola-padrao');
                """);
        } catch (Exception ignored) {}

        try {
            jdbcTemplate.execute("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS escola_id BIGINT;");
        } catch (Exception ignored) {}

        // Vincula todos os usuários sem escola à escola padrão (exceto MASTER)
        try {
            jdbcTemplate.execute("""
                UPDATE usuarios SET escola_id = (SELECT id FROM escolas WHERE slug = 'escola-padrao')
                WHERE escola_id IS NULL AND (role IS NULL OR role != 'MASTER');
                """);
        } catch (Exception ignored) {}

        // FK e índice
        try {
            jdbcTemplate.execute("""
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE constraint_name = 'fk_usuarios_escola' AND table_name = 'usuarios'
                    ) THEN
                        ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_escola
                            FOREIGN KEY (escola_id) REFERENCES escolas(id);
                    END IF;
                END $$;
                """);
        } catch (Exception ignored) {}

        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_usuarios_escola_id ON usuarios(escola_id);");
        } catch (Exception ignored) {}

        // Drop old unique constraints/indexes on ONLY login (without escola_id)
        // Hibernate ddl-auto=update never drops constraints, so old single-column unique on login blocks multi-tenant
        try {
            jdbcTemplate.execute("""
                DO $$ DECLARE r RECORD; BEGIN
                    -- Drop unique INDEXES on usuarios that cover only 'login' (not composite with escola_id)
                    FOR r IN
                        SELECT i.relname AS index_name
                        FROM pg_index ix
                        JOIN pg_class i ON i.oid = ix.indexrelid
                        JOIN pg_class t ON t.oid = ix.indrelid
                        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
                        WHERE t.relname = 'usuarios'
                          AND ix.indisunique = TRUE
                          AND i.relname != 'ux_usuarios_login_escola'
                          AND i.relname != 'usuarios_pkey'
                        GROUP BY i.relname
                        HAVING array_agg(a.attname ORDER BY a.attname) = ARRAY['login']
                    LOOP
                        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.index_name);
                    END LOOP;
                    -- Drop unique CONSTRAINTS on usuarios that cover only 'login'
                    FOR r IN
                        SELECT tc.constraint_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.constraint_column_usage ccu
                            ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
                        WHERE tc.table_name = 'usuarios'
                          AND tc.constraint_type = 'UNIQUE'
                          AND tc.constraint_name != 'ux_usuarios_login_escola'
                        GROUP BY tc.constraint_name
                        HAVING array_agg(ccu.column_name ORDER BY ccu.column_name) = ARRAY['login']
                    LOOP
                        EXECUTE 'ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
                    END LOOP;
                END $$;
                """);
        } catch (Exception ignored) {}

        try {
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_login_escola ON usuarios(login, escola_id);");
        } catch (Exception ignored) {}

        // Multi-tenant: adiciona escola_id em todas as tabelas principais
        String[] tabelas = {
            "series", "turmas", "materias", "comunicados", "audit_log",
            "fin_configuracoes", "fin_pessoas", "fin_formas_pagamento",
            "fin_funcionarios", "fin_contratos", "fin_contas_pagar",
            "fin_contas_receber", "fin_contas_pagar_modelo",
            "fin_serie_valor", "fin_movimentacoes"
        };
        for (String tabela : tabelas) {
            try {
                jdbcTemplate.execute("ALTER TABLE " + tabela + " ADD COLUMN IF NOT EXISTS escola_id BIGINT;");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute(
                    "UPDATE " + tabela + " SET escola_id = (SELECT id FROM escolas WHERE slug = 'escola-padrao') " +
                    "WHERE escola_id IS NULL;"
                );
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_" + tabela + "_escola_id ON " + tabela + "(escola_id);");
            } catch (Exception ignored) {}
        }
    }
}
