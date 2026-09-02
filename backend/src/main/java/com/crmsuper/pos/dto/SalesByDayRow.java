package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class SalesByDayRow {
    private final String dia;
    private final BigDecimal total;
    private final long cantidad;

    public SalesByDayRow(String dia, BigDecimal total, long cantidad) {
        this.dia = dia;
        this.total = total;
        this.cantidad = cantidad;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getDia() {
        return dia;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public long getCantidad() {
        return cantidad;
    }

    public static class Builder {
        private String dia;
        private BigDecimal total;
        private long cantidad;

        public Builder dia(String dia) {
            this.dia = dia;
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

        public SalesByDayRow build() {
            return new SalesByDayRow(dia, total, cantidad);
        }
    }
}
