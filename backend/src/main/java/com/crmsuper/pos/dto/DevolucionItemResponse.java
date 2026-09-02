package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class DevolucionItemResponse {
    private final Long id;
    private final Long detalleVentaId;
    private final Long productoId;
    private final String productoNombre;
    private final BigDecimal cantidad;
    private final BigDecimal precioUnitario;
    private final BigDecimal total;

    public DevolucionItemResponse(Long id, Long detalleVentaId, Long productoId, String productoNombre,
                                   BigDecimal cantidad, BigDecimal precioUnitario, BigDecimal total) {
        this.id = id;
        this.detalleVentaId = detalleVentaId;
        this.productoId = productoId;
        this.productoNombre = productoNombre;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.total = total;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public Long getDetalleVentaId() {
        return detalleVentaId;
    }

    public Long getProductoId() {
        return productoId;
    }

    public String getProductoNombre() {
        return productoNombre;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public static class Builder {
        private Long id;
        private Long detalleVentaId;
        private Long productoId;
        private String productoNombre;
        private BigDecimal cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal total;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder detalleVentaId(Long detalleVentaId) {
            this.detalleVentaId = detalleVentaId;
            return this;
        }

        public Builder productoId(Long productoId) {
            this.productoId = productoId;
            return this;
        }

        public Builder productoNombre(String productoNombre) {
            this.productoNombre = productoNombre;
            return this;
        }

        public Builder cantidad(BigDecimal cantidad) {
            this.cantidad = cantidad;
            return this;
        }

        public Builder precioUnitario(BigDecimal precioUnitario) {
            this.precioUnitario = precioUnitario;
            return this;
        }

        public Builder total(BigDecimal total) {
            this.total = total;
            return this;
        }

        public DevolucionItemResponse build() {
            return new DevolucionItemResponse(id, detalleVentaId, productoId, productoNombre, cantidad,
                    precioUnitario, total);
        }
    }
}
