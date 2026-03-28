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
}
