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

        try {
            String header = request.getHeader("Authorization");

            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);

                if (jwtUtil.tokenValido(token)) {
                    String login = jwtUtil.extrairLogin(token);
                    String role = jwtUtil.extrairRole(token);
                    Long escolaId = jwtUtil.extrairEscolaId(token);

                    var usuario = escolaId != null
                            ? usuarioRepository.findByLoginAndEscolaId(login, escolaId)
                            : usuarioRepository.findByLogin(login);

                    // MASTER impersonation: token has escolaId but user has escola=null in DB
                    if (usuario.isEmpty() && "MASTER".equals(role) && escolaId != null) {
                        usuario = usuarioRepository.findByLoginAndEscolaIsNullAndRole(login, "MASTER");
                    }

                    if (usuario.isPresent() && Boolean.TRUE.equals(usuario.get().getAtivo())) {
                        // Set TenantContext when escolaId is present (including MASTER impersonation)
                        if (escolaId != null) {
                            TenantContext.setEscolaId(escolaId);
                        }

                        // MASTER impersonating a school gets both ROLE_MASTER and ROLE_DIRECAO
                        // so all @PreAuthorize("hasRole('DIRECAO')") pass without modification
                        var authorities = "MASTER".equals(role) && escolaId != null
                                ? List.of(new SimpleGrantedAuthority("ROLE_MASTER"),
                                          new SimpleGrantedAuthority("ROLE_DIRECAO"))
                                : List.of(new SimpleGrantedAuthority("ROLE_" + role));

                        var auth = new UsernamePasswordAuthenticationToken(
                                login, null, authorities
                        );
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}