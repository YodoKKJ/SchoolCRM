package com.dom.schoolcrm.service.boleto;

/**
 * Exceção lançada quando uma operação de boleto falha na integração com o banco.
 */
public class BoletoRegistroException extends RuntimeException {

    public BoletoRegistroException(String message) {
        super(message);
    }

    public BoletoRegistroException(String message, Throwable cause) {
        super(message, cause);
    }
}
