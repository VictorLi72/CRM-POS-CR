package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.MetodoPago;

import java.math.BigDecimal;

public class VentasPorMetodoRow {
    private final MetodoPago metodoPago;
    private final BigDecimal total;
    private final long cantidad;

    public VentasPorMetodoRow(MetodoPago metodoPago, BigDecimal total, long cantidad) {
        this.metodoPago = metodoPago;
        this.total = total;
        this.cantidad = cantidad;
    }

    public static Builder builder() {
        return new Builder();
    }

    public MetodoPago getMetodoPago() {
        return metodoPago;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public long getCantidad() {
        return cantidad;
    }

    public static class Builder {
        private MetodoPago metodoPago;
        private BigDecimal total;
        private long cantidad;

        public Builder metodoPago(MetodoPago metodoPago) {
            this.metodoPago = metodoPago;
            return this;
        }

        public Builder total(BigDecimal total) {
            this.total = total;
            return this;
        }

        public Builder cantidad(long cantidad) {
            this.cantidad = cantidad;
            return this;
        }

        public VentasPorMetodoRow build() {
            return new VentasPorMetodoRow(metodoPago, total, cantidad);
        }
    }
}
