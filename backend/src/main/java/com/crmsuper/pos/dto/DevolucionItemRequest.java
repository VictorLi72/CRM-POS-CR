package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class DevolucionItemRequest {
    private Long detalleVentaId;
    private BigDecimal cantidad;

    public Long getDetalleVentaId() {
        return detalleVentaId;
    }

    public void setDetalleVentaId(Long detalleVentaId) {
        this.detalleVentaId = detalleVentaId;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }
}
