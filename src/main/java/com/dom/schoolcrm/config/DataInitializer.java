package com.dom.schoolcrm.config;

import com.dom.schoolcrm.entity.Usuario;
import com.dom.schoolcrm.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

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
}
