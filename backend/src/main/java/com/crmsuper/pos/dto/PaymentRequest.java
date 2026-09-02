package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class PaymentRequest {
    private BigDecimal monto;

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }
}
