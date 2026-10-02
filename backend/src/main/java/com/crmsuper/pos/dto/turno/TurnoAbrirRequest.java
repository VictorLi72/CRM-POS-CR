package com.crmsuper.pos.dto.turno;

import java.math.BigDecimal;

public class TurnoAbrirRequest {
    private BigDecimal montoApertura;

    public BigDecimal getMontoApertura() {
        return montoApertura;
    }

    public void setMontoApertura(BigDecimal montoApertura) {
        this.montoApertura = montoApertura;
    }
}
