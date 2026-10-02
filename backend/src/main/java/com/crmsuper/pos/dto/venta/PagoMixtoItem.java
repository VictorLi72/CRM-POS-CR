package com.crmsuper.pos.dto.venta;

import com.crmsuper.pos.model.enums.MetodoPago;

import java.math.BigDecimal;

public class PagoMixtoItem {

    private MetodoPago metodo;
    private BigDecimal monto;

    public PagoMixtoItem() {}

    public PagoMixtoItem(MetodoPago metodo, BigDecimal monto) {
        this.metodo = metodo;
        this.monto = monto;
    }

    public MetodoPago getMetodo() { return metodo; }
    public void setMetodo(MetodoPago metodo) { this.metodo = metodo; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
}
