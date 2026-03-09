package com.dom.schoolcrm.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // SPA fallback é tratado pelo SpaController (ErrorController) que
    // redireciona 404s para /index.html — não usamos addViewController
    // para evitar conflito com métodos POST/DELETE/PATCH nas rotas de API.
}