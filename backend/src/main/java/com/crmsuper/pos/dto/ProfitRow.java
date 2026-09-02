package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class ProfitRow {
    private final String productoNombre;
    private final BigDecimal cantidad;
    private final BigDecimal ingresoSinIva;
    private final BigDecimal costo;
    private final BigDecimal ganancia;

    public ProfitRow(String productoNombre, BigDecimal cantidad, BigDecimal ingresoSinIva, BigDecimal costo,
                      BigDecimal ganancia) {
        this.productoNombre = productoNombre;
        this.cantidad = cantidad;
        this.ingresoSinIva = ingresoSinIva;
        this.costo = costo;
        this.ganancia = ganancia;
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

    public BigDecimal getIngresoSinIva() {
        return ingresoSinIva;
    }

    public BigDecimal getCosto() {
        return costo;
    }

    public BigDecimal getGanancia() {
        return ganancia;
    }

    public static class Builder {
        private String productoNombre;
        private BigDecimal cantidad;
        private BigDecimal ingresoSinIva;
        private BigDecimal costo;
        private BigDecimal ganancia;

        public Builder productoNombre(String productoNombre) {
            this.productoNombre = productoNombre;
            return this;
        }

        public Builder cantidad(BigDecimal cantidad) {
            this.cantidad = cantidad;
            return this;
        }

        public Builder ingresoSinIva(BigDecimal ingresoSinIva) {
            this.ingresoSinIva = ingresoSinIva;
            return this;
        }

        public Builder costo(BigDecimal costo) {
            this.costo = costo;
            return this;
        }

        public Builder ganancia(BigDecimal ganancia) {
            this.ganancia = ganancia;
            return this;
        }

        public ProfitRow build() {
            return new ProfitRow(productoNombre, cantidad, ingresoSinIva, costo, ganancia);
        }
    }
}
