package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.TipoMovimiento;

import java.math.BigDecimal;

public class StockAdjustRequest {
    private TipoMovimiento tipo;
    private BigDecimal cantidad;
    private String referencia;

    public TipoMovimiento getTipo() {
        return tipo;
    }

    public void setTipo(TipoMovimiento tipo) {
        this.tipo = tipo;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }
}
