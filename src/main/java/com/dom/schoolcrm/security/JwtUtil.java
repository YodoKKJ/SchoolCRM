package com.dom.schoolcrm.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private final long expiracaoMs = 604800000L;          // 7 dias
    private final long expiracaoLembrarMs = 2592000000L; // 30 dias

    @PostConstruct
    public void validarSecret() {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException(
                "JWT_SECRET deve ter pelo menos 32 caracteres. " +
                "Defina a variável de ambiente JWT_SECRET em produção.");
        }
        if (secret.contains("dev-secret-local") || secret.contains("nao-usar-em-producao")) {
            // Apenas avisa em dev; não bloqueia
            System.err.println("[AVISO] JWT_SECRET está usando o valor de desenvolvimento. " +
                               "Defina JWT_SECRET via variável de ambiente em produção.");
        }
    }

    private Key getChave() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String gerarToken(String login, String role, boolean lembrar) {
        long expiracao = lembrar ? expiracaoLembrarMs : expiracaoMs;
        return Jwts.builder()
                .setSubject(login)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiracao))
                .signWith(getChave())
                .compact();
    }

    public String extrairLogin(String token) {
        return extrairClaims(token).getSubject();
    }

    public String extrairRole(String token) {
        return extrairClaims(token).get("role", String.class);
    }

    public boolean tokenValido(String token) {
        try {
            extrairClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extrairClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getChave())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}