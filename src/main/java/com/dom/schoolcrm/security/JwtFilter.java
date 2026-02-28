package com.dom.schoolcrm.security;

import com.dom.schoolcrm.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.startsWith("/assets") ||
                path.equals("/") ||
                path.equals("/index.html") ||
                path.endsWith(".js") ||
                path.endsWith(".css") ||
                path.endsWith(".map") ||
                path.endsWith(".ico")) {

            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        // ===== DEBUG TEMPORÁRIO - REMOVER DEPOIS =====
        System.out.println(">>> [JwtFilter] Método: " + request.getMethod() + " | URI: " + request.getRequestURI());
        System.out.println(">>> [JwtFilter] Authorization header: " + (header != null ? "PRESENTE" : "AUSENTE"));
        // ==============================================

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtUtil.tokenValido(token)) {
                String login = jwtUtil.extrairLogin(token);
                String role = jwtUtil.extrairRole(token);

                // ===== DEBUG TEMPORÁRIO =====
                System.out.println(">>> [JwtFilter] Token válido! Login: " + login + " | Role: " + role);
                System.out.println(">>> [JwtFilter] Authority setada: ROLE_" + role);
                // ============================

                var usuario = usuarioRepository.findByLogin(login);

                if (usuario.isPresent()) {
                    var auth = new UsernamePasswordAuthenticationToken(
                            login,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    // ===== DEBUG TEMPORÁRIO =====
                    System.out.println(">>> [JwtFilter] USUÁRIO NÃO ENCONTRADO NO BANCO para login: " + login);
                    // ============================
                }
            } else {
                // ===== DEBUG TEMPORÁRIO =====
                System.out.println(">>> [JwtFilter] TOKEN INVÁLIDO!");
                // ============================
            }
        }

        filterChain.doFilter(request, response);
    }
}