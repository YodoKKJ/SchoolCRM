package com.dom.schoolcrm.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Redireciona erros 404 para o index.html do React.
 * Necessário para que o refresh de página funcione no React Router.
 */
@Controller
public class SpaController implements ErrorController {

    @RequestMapping("/error")
    public String handleError() {
        return "forward:/index.html";
    }
}
