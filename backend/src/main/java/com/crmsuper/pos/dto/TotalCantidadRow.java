package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class TotalCantidadRow {
    private final BigDecimal total;
    private final long cantidad;

    public TotalCantidadRow(BigDecimal total, long cantidad) {
        this.total = total;
        this.cantidad = cantidad;
    }

    public static Builder builder() {
        return new Builder();
    }

    public BigDecimal getTotal() {
        return total;
    }

    public long getCantidad() {
        return cantidad;
    }

    public static class Builder {
        private BigDecimal total;
        private long cantidad;

        public Builder total(BigDecimal total) {
            this.total = total;
            return this;
        }

        public Builder cantidad(long cantidad) {
            this.cantidad = cantidad;
            return this;
        }

        public TotalCantidadRow build() {
            return new TotalCantidadRow(total, cantidad);
        }
    }
}
