package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class SalesByCashierRow {
    private final String cajeroNombre;
    private final BigDecimal ingreso;
    private final long cantidad;

    public SalesByCashierRow(String cajeroNombre, BigDecimal ingreso, long cantidad) {
        this.cajeroNombre = cajeroNombre;
        this.ingreso = ingreso;
        this.cantidad = cantidad;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getCajeroNombre() {
        return cajeroNombre;
    }

    public BigDecimal getIngreso() {
        return ingreso;
    }

    public long getCantidad() {
        return cantidad;
    }

    public static class Builder {
        private String cajeroNombre;
        private BigDecimal ingreso;
        private long cantidad;

        public Builder cajeroNombre(String cajeroNombre) {
            this.cajeroNombre = cajeroNombre;
            return this;
        }

        public Builder ingreso(BigDecimal ingreso) {
            this.ingreso = ingreso;
            return this;
        }

        public Builder cantidad(long cantidad) {
            this.cantidad = cantidad;
            return this;
        }

        public SalesByCashierRow build() {
            return new SalesByCashierRow(cajeroNombre, ingreso, cantidad);
        }
    }
}
