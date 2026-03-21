package com.dom.schoolcrm.service.boleto;

import com.dom.schoolcrm.entity.FinBoleto;
import com.dom.schoolcrm.entity.FinContaReceber;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Implementação real do BoletoService usando a API REST do Sicoob.
 * Ativa quando sicoob.api.enabled=true em application.properties.
 *
 * TODO: Implementar quando as credenciais de sandbox estiverem disponíveis.
 * - OAuth2 client credentials flow para obter access_token
 * - POST /cobranca-bancaria/v2/boletos para registro
 * - GET /cobranca-bancaria/v2/boletos/{nossoNumero} para consulta
 * - PATCH /cobranca-bancaria/v2/boletos/{nossoNumero}/baixa para cancelamento
 * - Retorno inclui dados PIX (QR code) automaticamente no boleto híbrido
 */
@Service
@ConditionalOnProperty(name = "sicoob.api.enabled", havingValue = "true")
public class SicoobBoletoService implements BoletoService {

    @Override
    public FinBoleto registrar(FinBoleto boleto, FinContaReceber cr) {
        // TODO: Implementar chamada real à API Sicoob
        // 1. Obter access_token via OAuth2 (client_credentials)
        // 2. Montar payload JSON com dados do boleto + pagador
        // 3. POST /cobranca-bancaria/v2/boletos
        // 4. Parsear resposta e preencher boleto com nossoNumero, linhaDigitavel, etc.
        // 5. PIX vem automaticamente no boleto híbrido
        throw new BoletoRegistroException(
                "Integração Sicoob ainda não implementada. Configure sicoob.api.enabled=false para usar o mock.");
    }

    @Override
    public FinBoleto consultar(FinBoleto boleto) {
        // TODO: GET /cobranca-bancaria/v2/boletos/{nossoNumero}
        throw new BoletoRegistroException("Consulta Sicoob ainda não implementada.");
    }

    @Override
    public FinBoleto cancelar(FinBoleto boleto) {
        // TODO: PATCH /cobranca-bancaria/v2/boletos/{nossoNumero}/baixa
        throw new BoletoRegistroException("Cancelamento Sicoob ainda não implementado.");
    }

    @Override
    public boolean isAtivo() {
        return false; // Será true quando a implementação estiver completa
    }

    @Override
    public String getProvedor() {
        return "SICOOB";
    }
}
