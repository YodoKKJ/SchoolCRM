package com.dom.schoolcrm.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * Serve o index.html do React para:
 *  - Rotas SPA conhecidas (/direcao, /professor, /aluno)
 *  - Qualquer erro de navegação (/error)
 *
 * Necessário para que o refresh de página funcione no React Router.
 *
 * IMPORTANTE: apenas GET faz forward para index.html.
 * POST/PUT/PATCH/DELETE resultam em resposta JSON — evita o ciclo
 * "POST /api → exceção → /error como POST → forward /index.html → 405".
 */
@Controller
public class SpaController implements ErrorController {

    @RequestMapping(value = {
        "/direcao", "/professor", "/aluno", "/escola",
        "/escola/{slug}/login", "/escola/{slug}/direcao",
        "/escola/{slug}/professor", "/escola/{slug}/aluno"
    })
    public String handleSpaRoutes() {
        return "forward:/index.html";
    }

    @GetMapping("/error")
    public String handleErrorGet() {
        return "forward:/index.html";
    }

    @RequestMapping("/error")
    @ResponseBody
    public ResponseEntity<Void> handleErrorApi(HttpServletRequest request) {
        Integer status = (Integer) request.getAttribute("jakarta.servlet.error.status_code");
        return ResponseEntity.status(status != null ? status : 500).build();
    }
}
