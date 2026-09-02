package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class TurnoCerrarRequest {
    private BigDecimal efectivoContado;
    private String notas;

    public BigDecimal getEfectivoContado() {
        return efectivoContado;
    }

    public void setEfectivoContado(BigDecimal efectivoContado) {
        this.efectivoContado = efectivoContado;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }
}
