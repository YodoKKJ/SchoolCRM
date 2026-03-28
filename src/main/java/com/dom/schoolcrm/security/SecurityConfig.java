package com.dom.schoolcrm.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(proxyTargetClass = true)
@EnableCaching
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOriginsRaw;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // API de autenticação e preflight CORS
                        .requestMatchers("/auth/**").permitAll()

                        // 🔓 Webhook Sicoob — endpoint público para notificações de pagamento
                        .requestMatchers("/webhooks/sicoob/**").permitAll()

                        // 🔓 Preflight CORS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 🔓 Config acadêmica (mediaMinima/freqMinima) — acessível a todos os usuários autenticados
                        .requestMatchers(HttpMethod.GET, "/notas/config").authenticated()
                        // 🔒 Módulo financeiro — /fin/configuracoes restrito a DIRECAO/COORDENACAO/MASTER (contém dados financeiros sensíveis)
                        .requestMatchers(HttpMethod.GET, "/fin/configuracoes").hasAnyRole("DIRECAO", "COORDENACAO", "MASTER")
                        .requestMatchers("/fin/**").hasAnyRole("DIRECAO", "MASTER")

                        // 🔒 WhatsApp — restrito a DIRECAO (config + envio)
                        .requestMatchers("/whatsapp/**").hasRole("DIRECAO")

                        // 🔒 Regras específicas
                        .requestMatchers(HttpMethod.DELETE, "/turmas/**").hasAnyRole("DIRECAO", "COORDENACAO", "MASTER")
                        .requestMatchers(HttpMethod.DELETE, "/materias/**").hasAnyRole("DIRECAO", "COORDENACAO", "MASTER")
                        .requestMatchers(HttpMethod.DELETE, "/vinculos/**").hasAnyRole("DIRECAO", "COORDENACAO", "MASTER")

                        // 🔓 Escolas — acesso controlado por @PreAuthorize no controller (MASTER, ADMIN, DIRECAO)
                        .requestMatchers("/escolas/**").authenticated()


                        .anyRequest().authenticated()
                )

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                )

                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = List.of(allowedOriginsRaw.split(","));

        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    // Arquivos estáticos do React ficam completamente fora do filtro de segurança
    // (web.ignoring é necessário no Spring Security 6 para static resources sem controller)
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring().requestMatchers(
                new AntPathRequestMatcher("/"),
                new AntPathRequestMatcher("/index.html"),
                new AntPathRequestMatcher("/assets/**"),
                new AntPathRequestMatcher("/favicon.ico"),
                new AntPathRequestMatcher("/vite.svg"),
                new AntPathRequestMatcher("/error"),
                // PWA assets — devem ser públicos para o browser registrar o service worker
                new AntPathRequestMatcher("/manifest.json"),
                new AntPathRequestMatcher("/manifest.webmanifest"),
                new AntPathRequestMatcher("/sw.js"),
                new AntPathRequestMatcher("/icon.svg"),
                new AntPathRequestMatcher("/*.png"),
                new AntPathRequestMatcher("/*.ico"),
                new AntPathRequestMatcher("/*.svg"),
                // Rotas SPA do React — navegação do browser não carrega JWT header
                new AntPathRequestMatcher("/direcao"),
                new AntPathRequestMatcher("/professor"),
                new AntPathRequestMatcher("/aluno"),
                // Landing page pública da escola — sem autenticação
                new AntPathRequestMatcher("/escola"),
                // Multi-tenant: rotas SPA com slug da escola
                new AntPathRequestMatcher("/escola/*/login"),
                new AntPathRequestMatcher("/escola/*/direcao"),
                new AntPathRequestMatcher("/escola/*/professor"),
                new AntPathRequestMatcher("/escola/*/aluno"),
                // Master SPA routes
                new AntPathRequestMatcher("/master"),
                new AntPathRequestMatcher("/master/**")
        );
    }

    @Bean
    public FilterRegistrationBean<JwtFilter> jwtFilterRegistration(JwtFilter jwtFilter) {
        FilterRegistrationBean<JwtFilter> registration = new FilterRegistrationBean<>(jwtFilter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}