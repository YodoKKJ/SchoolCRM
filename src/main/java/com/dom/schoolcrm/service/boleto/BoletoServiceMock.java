package com.dom.schoolcrm.service.boleto;

import com.dom.schoolcrm.entity.FinBoleto;
import com.dom.schoolcrm.entity.FinContaReceber;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Implementação mock do BoletoService para desenvolvimento.
 * Ativa quando sicoob.api.enabled=false (padrão).
 * Gera dados fictícios simulando a resposta da API Sicoob.
 */
@Service
@ConditionalOnProperty(name = "sicoob.api.enabled", havingValue = "false", matchIfMissing = true)
public class BoletoServiceMock implements BoletoService {

    private final AtomicLong nossoNumeroSequence = new AtomicLong(100000);

    @Override
    public FinBoleto registrar(FinBoleto boleto, FinContaReceber cr) {
        String nossoNumero = String.valueOf(nossoNumeroSequence.incrementAndGet());
        String sicoobId = "MOCK-" + UUID.randomUUID().toString().substring(0, 8);

        boleto.setNossoNumero(nossoNumero);
        boleto.setSeuNumero("CR-" + cr.getId());
        boleto.setSicoobId(sicoobId);
        boleto.setStatus("EMITIDO");
        boleto.setDataEmissao(LocalDate.now());

        // Simula linha digitável (47 dígitos) e código de barras (44 dígitos)
        boleto.setLinhaDigitavel(gerarLinhaDigitavelMock(nossoNumero));
        boleto.setCodigoBarras(gerarCodigoBarrasMock(nossoNumero));

        // Simula PIX copia-e-cola e URL do QR code
        boleto.setPixCopiaCola("00020126580014br.gov.bcb.pix0136" + UUID.randomUUID() + "5204000053039865802BR5925ESCOLA MOCK SICOOB6009SAO PAULO62070503***6304MOCK");
        boleto.setPixUrl("https://mock.sicoob.com.br/qrcode/" + sicoobId);

        return boleto;
    }

    @Override
    public FinBoleto consultar(FinBoleto boleto) {
        // Mock: mantém o status atual sem alteração
        return boleto;
    }

    @Override
    public FinBoleto cancelar(FinBoleto boleto) {
        boleto.setStatus("CANCELADO");
        return boleto;
    }

    @Override
    public boolean isAtivo() {
        return true;
    }

    @Override
    public String getProvedor() {
        return "MOCK";
    }

    private String gerarLinhaDigitavelMock(String nossoNumero) {
        // 75691.12345 12345.678901 12345.678901 1 12340000012000
        String base = "75691" + padLeft(nossoNumero, 10) + "00000000001234000001";
        return base + "0".repeat(Math.max(0, 47 - base.length()));
    }

    private String gerarCodigoBarrasMock(String nossoNumero) {
        String base = "7569" + padLeft(nossoNumero, 10) + "0000000001234000001";
        return base + "0".repeat(Math.max(0, 44 - base.length()));
    }

    private String padLeft(String s, int len) {
        if (s.length() >= len) return s.substring(0, len);
        return "0".repeat(len - s.length()) + s;
    }
}
