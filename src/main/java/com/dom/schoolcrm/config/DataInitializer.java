package com.dom.schoolcrm.config;

import com.dom.schoolcrm.entity.Escola;
import com.dom.schoolcrm.entity.FinFormaPagamento;
import com.dom.schoolcrm.entity.Serie;
import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.EscolaRepository;
import com.dom.schoolcrm.repository.FinFormaPagamentoRepository;
import com.dom.schoolcrm.repository.SerieRepository;
import com.dom.schoolcrm.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.sql.DataSource;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initEscolaPadrao(EscolaRepository escolaRepo) {
        return args -> {
            if (escolaRepo.findBySlug("escola-padrao").isEmpty()) {
                Escola escola = new Escola();
                escola.setNome("Escola Padrão");
                escola.setSlug("escola-padrao");
                escola.setAtivo(true);
                escolaRepo.save(escola);
                System.out.println(">>> Escola padrão criada com slug: escola-padrao");
            }
        };
    }

    @Bean
    CommandLineRunner initAdmin(UsuarioRepository repo, EscolaRepository escolaRepo, PasswordEncoder encoder) {
        return args -> {
            Escola escolaPadrao = escolaRepo.findBySlug("escola-padrao").orElse(null);
            if (escolaPadrao == null) return;

            if (repo.findByLoginAndEscolaId("admin", escolaPadrao.getId()).isEmpty()) {
                // Verifica se já existe um admin legado sem escola
                var adminLegado = repo.findByLogin("admin");
                if (adminLegado.isPresent() && adminLegado.get().getEscola() == null) {
                    adminLegado.get().setEscola(escolaPadrao);
                    repo.save(adminLegado.get());
                    System.out.println(">>> Admin existente vinculado à escola padrão");
                } else if (adminLegado.isEmpty()) {
                    Usuario admin = new Usuario();
                    admin.setLogin("admin");
                    admin.setSenhaHash(encoder.encode("admin123"));
                    admin.setNome("Administrador");
                    admin.setRole("DIRECAO");
                    admin.setAtivo(true);
                    admin.setEscola(escolaPadrao);
                    repo.save(admin);
                    System.out.println(">>> Usuário admin criado com senha: admin123");
                }
            }
        };
    }

    @Bean
    CommandLineRunner initMaster(UsuarioRepository repo, PasswordEncoder encoder) {
        return args -> {
            // MASTER: sem escola vinculada (escola = null)
            if (repo.findByLoginAndEscolaIsNullAndRole("yodo", "MASTER").isEmpty()) {
                Usuario master = new Usuario();
                master.setLogin("yodo");
                master.setSenhaHash(encoder.encode("Cacto1010_"));
                master.setNome("Yodo Master");
                master.setRole("MASTER");
                master.setAtivo(true);
                // escola = null → acesso a todas as escolas
                repo.save(master);
                System.out.println(">>> Usuário MASTER 'yodo' criado");
            }
        };
    }

    @Bean
    CommandLineRunner initSeries(SerieRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                List<String> nomes = List.of(
                    "1º Ano EF", "2º Ano EF", "3º Ano EF", "4º Ano EF", "5º Ano EF",
                    "6º Ano EF", "7º Ano EF", "8º Ano EF", "9º Ano EF",
                    "1ª Série EM", "2ª Série EM", "3ª Série EM"
                );
                for (String nome : nomes) {
                    Serie s = new Serie();
                    s.setNome(nome);
                    repo.save(s);
                }
                System.out.println(">>> 12 séries criadas (EF 1-9 + EM 1-3)");
            }
        };
    }

    @Bean
    CommandLineRunner initFormaPagamentoBoleto(FinFormaPagamentoRepository repo) {
        return args -> {
            if (!repo.existsByNomeIgnoreCase("BOLETO_SICOOB")) {
                FinFormaPagamento fp = new FinFormaPagamento();
                fp.setNome("BOLETO_SICOOB");
                fp.setAtivo(true);
                repo.save(fp);
                System.out.println(">>> Forma de pagamento BOLETO_SICOOB criada");
            }
        };
    }

    /**
     * Migração one-time: atribui escola_id à escola padrão em todos os registros órfãos
     * (criados antes do multi-tenant). Idempotente — só atualiza onde escola_id IS NULL.
     * Pula usuarios com role MASTER (que devem ficar sem escola).
     */
    @Bean
    CommandLineRunner migrateOrphanDataToEscolaPadrao(EscolaRepository escolaRepo, DataSource dataSource) {
        return args -> {
            Escola escola = escolaRepo.findBySlug("escola-padrao").orElse(null);
            if (escola == null) return;
            Long id = escola.getId();

            // Tabelas que têm coluna escola_id (Long direto)
            List<String> tabelas = List.of(
                "turmas", "series", "materias", "comunicados", "audit_log",
                "fin_contas_pagar", "fin_contas_receber", "fin_contratos",
                "fin_configuracoes", "fin_formas_pagamento", "fin_movimentacoes",
                "fin_pessoas", "fin_funcionarios", "fin_serie_valor",
                "fin_contas_pagar_modelo"
            );

            int totalMigrado = 0;
            try (var conn = dataSource.getConnection()) {
                for (String tabela : tabelas) {
                    // Verifica se a tabela existe (evita erro em banco novo)
                    try (var check = conn.prepareStatement(
                            "SELECT 1 FROM information_schema.columns WHERE table_name = ? AND column_name = 'escola_id'")) {
                        check.setString(1, tabela);
                        if (!check.executeQuery().next()) continue;
                    }
                    try (var stmt = conn.prepareStatement(
                            "UPDATE " + tabela + " SET escola_id = ? WHERE escola_id IS NULL")) {
                        stmt.setLong(1, id);
                        int rows = stmt.executeUpdate();
                        if (rows > 0) {
                            totalMigrado += rows;
                            System.out.println(">>> Migração: " + rows + " registros em " + tabela + " → escola " + id);
                        }
                    }
                }

                // Usuarios: FK (ManyToOne), só migra não-MASTER
                try (var stmt = conn.prepareStatement(
                        "UPDATE usuarios SET escola_id = ? WHERE escola_id IS NULL AND (role IS NULL OR role != 'MASTER')")) {
                    stmt.setLong(1, id);
                    int rows = stmt.executeUpdate();
                    if (rows > 0) {
                        totalMigrado += rows;
                        System.out.println(">>> Migração: " + rows + " usuários → escola " + id);
                    }
                }
            }

            if (totalMigrado > 0) {
                System.out.println(">>> Migração completa: " + totalMigrado + " registros vinculados à escola '" + escola.getNome() + "' (id=" + id + ")");
            }
        };
    }
}
