package com.dom.schoolcrm.config;

import com.dom.schoolcrm.entity.Serie;
import com.dom.schoolcrm.entity.Usuario;
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
    CommandLineRunner initAdmin(UsuarioRepository repo, PasswordEncoder encoder) {
        return args -> {
            if (repo.findByLogin("admin").isEmpty()) {
                Usuario admin = new Usuario();
                admin.setLogin("admin");
                admin.setSenhaHash(encoder.encode("admin123"));
                admin.setNome("Administrador");
                admin.setRole("ADMIN");
                admin.setAtivo(true);
                repo.save(admin);
                System.out.println(">>> Usuário admin criado com senha: admin123");
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
}
