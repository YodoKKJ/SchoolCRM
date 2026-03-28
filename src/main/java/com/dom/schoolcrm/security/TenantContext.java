package com.dom.schoolcrm.security;

public class TenantContext {

    private static final ThreadLocal<Long> currentEscolaId = new ThreadLocal<>();

    public static void setEscolaId(Long escolaId) {
        currentEscolaId.set(escolaId);
    }

    public static Long getEscolaId() {
        return currentEscolaId.get();
    }

    public static void clear() {
        currentEscolaId.remove();
    }
}
