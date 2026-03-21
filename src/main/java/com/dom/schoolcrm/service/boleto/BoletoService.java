package com.dom.schoolcrm.service.boleto;

import com.dom.schoolcrm.entity.FinBoleto;
import com.dom.schoolcrm.entity.FinContaReceber;

/**
 * Interface para integração com banco emissor de boletos.
 * Implementações: BoletoServiceMock (desenvolvimento) e SicoobBoletoService (produção).
 */
public interface BoletoService {

    /**
     * Registra um boleto híbrido (boleto + PIX) no banco emissor.
     * Preenche os campos do FinBoleto com os dados retornados pela API
     * (nossoNumero, linhaDigitavel, codigoBarras, pixCopiaCola, pixUrl, sicoobId).
     *
     * @param boleto   entidade já com contaReceber, valor, vencimento e dados do pagador preenchidos
     * @param cr       conta a receber vinculada (para contexto adicional se necessário)
     * @return boleto atualizado com dados do banco
     * @throws BoletoRegistroException se o registro falhar
     */
    FinBoleto registrar(FinBoleto boleto, FinContaReceber cr);

    /**
     * Consulta o status atualizado de um boleto no banco emissor.
     *
     * @param boleto boleto com sicoobId preenchido
     * @return boleto com status atualizado
     */
    FinBoleto consultar(FinBoleto boleto);

    /**
     * Solicita o cancelamento (baixa) de um boleto no banco emissor.
     *
     * @param boleto boleto a ser cancelado
     * @return boleto com status CANCELADO
     * @throws BoletoRegistroException se o cancelamento falhar
     */
    FinBoleto cancelar(FinBoleto boleto);

    /**
     * Verifica se a integração com o banco está ativa e configurada.
     */
    boolean isAtivo();

    /**
     * Retorna o nome da implementação (ex: "MOCK", "SICOOB").
     */
    String getProvedor();
}
