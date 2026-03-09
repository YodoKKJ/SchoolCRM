package com.dom.schoolcrm.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

/**
 * Redireciona erros 404 para o index.html do React (navegação SPA).
 * Necessário para que o refresh de página funcione no React Router.
 *
 * IMPORTANTE: apenas GET faz forward para index.html.
 * POST/PUT/PATCH/DELETE resultam em resposta JSON — evita o ciclo
 * "POST /api → exceção → /error como POST → forward /index.html → 405".
 */
@Controller
public class SpaController implements ErrorController {

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
