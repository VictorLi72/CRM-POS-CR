package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class SalesByCategoryRow {
    private final String categoria;
    private final BigDecimal ingreso;
    private final BigDecimal cantidad;

    public SalesByCategoryRow(String categoria, BigDecimal ingreso, BigDecimal cantidad) {
        this.categoria = categoria;
        this.ingreso = ingreso;
        this.cantidad = cantidad;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getCategoria() {
        return categoria;
    }

    public BigDecimal getIngreso() {
        return ingreso;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public static class Builder {
        private String categoria;
        private BigDecimal ingreso;
        private BigDecimal cantidad;

        public Builder categoria(String categoria) {
            this.categoria = categoria;
            return this;
        }

        public Builder ingreso(BigDecimal ingreso) {
            this.ingreso = ingreso;
            return this;
        }

        public Builder cantidad(BigDecimal cantidad) {
            this.cantidad = cantidad;
            return this;
        }

        public SalesByCategoryRow build() {
            return new SalesByCategoryRow(categoria, ingreso, cantidad);
        }
    }
}
