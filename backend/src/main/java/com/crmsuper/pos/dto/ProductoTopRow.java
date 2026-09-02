package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class ProductoTopRow {
    private final String productoNombre;
    private final BigDecimal cantidad;
    private final BigDecimal ingreso;

    public ProductoTopRow(String productoNombre, BigDecimal cantidad, BigDecimal ingreso) {
        this.productoNombre = productoNombre;
        this.cantidad = cantidad;
        this.ingreso = ingreso;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getProductoNombre() {
        return productoNombre;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public BigDecimal getIngreso() {
        return ingreso;
    }

    public static class Builder {
        private String productoNombre;
        private BigDecimal cantidad;
        private BigDecimal ingreso;

        public Builder productoNombre(String productoNombre) {
            this.productoNombre = productoNombre;
            return this;
        }

        public Builder cantidad(BigDecimal cantidad) {
            this.cantidad = cantidad;
            return this;
        }

        public Builder ingreso(BigDecimal ingreso) {
            this.ingreso = ingreso;
            return this;
        }

        public ProductoTopRow build() {
            return new ProductoTopRow(productoNombre, cantidad, ingreso);
        }
    }
}
