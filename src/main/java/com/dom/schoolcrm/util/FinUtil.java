package com.dom.schoolcrm.util;

import com.dom.schoolcrm.entity.FinContaPagar;
import com.dom.schoolcrm.entity.FinContaReceber;

import java.time.LocalDate;

/**
 * Utilitários compartilhados do módulo financeiro.
 */
public class FinUtil {

    private FinUtil() {}

    public static String statusEfetivo(FinContaReceber cr, LocalDate hoje) {
        if ("PENDENTE".equals(cr.getStatus()) && cr.getDataVencimento().isBefore(hoje)) return "VENCIDO";
        return cr.getStatus();
    }

    public static String statusEfetivo(FinContaPagar cp, LocalDate hoje) {
        if ("PENDENTE".equals(cp.getStatus()) && cp.getDataVencimento().isBefore(hoje)) return "VENCIDO";
        return cp.getStatus();
    }
}
