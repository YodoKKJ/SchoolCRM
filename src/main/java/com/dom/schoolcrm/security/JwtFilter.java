package com.dom.schoolcrm.security;

import com.dom.schoolcrm.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(JwtFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String header = request.getHeader("Authorization");

            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);

                if (jwtUtil.tokenValido(token)) {
                    String login = jwtUtil.extrairLogin(token);
                    String role = jwtUtil.extrairRole(token);
                    Long escolaId = jwtUtil.extrairEscolaId(token);

                    try {
                        var usuario = escolaId != null
                                ? usuarioRepository.findByLoginAndEscolaId(login, escolaId)
                                : "MASTER".equals(role)
                                    ? usuarioRepository.findByLoginAndEscolaIsNullAndRole(login, "MASTER")
                                    : usuarioRepository.findByLogin(login);

                        // MASTER impersonation: token has escolaId but user has escola=null in DB
                        if (usuario.isEmpty() && "MASTER".equals(role) && escolaId != null) {
                            usuario = usuarioRepository.findByLoginAndEscolaIsNullAndRole(login, "MASTER");
                        }

                        if (usuario.isPresent() && Boolean.TRUE.equals(usuario.get().getAtivo())) {
                            if (escolaId != null) {
                                TenantContext.setEscolaId(escolaId);
                            }

                            var authorities = "MASTER".equals(role) && escolaId != null
                                    ? List.of(new SimpleGrantedAuthority("ROLE_MASTER"),
                                              new SimpleGrantedAuthority("ROLE_DIRECAO"))
                                    : List.of(new SimpleGrantedAuthority("ROLE_" + role));

                            var auth = new UsernamePasswordAuthenticationToken(
                                    login, null, authorities
                            );
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    } catch (Exception ex) {
                        log.warn("Erro ao buscar usuario no JwtFilter: login={}, role={}, escolaId={}: {}",
                                login, role, escolaId, ex.getMessage());
                    }
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}