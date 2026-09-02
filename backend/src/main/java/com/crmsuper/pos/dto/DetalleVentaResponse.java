package com.crmsuper.pos.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;

public class DetalleVentaResponse {
    private final Long id;
    private final Long productoId;
    private final String productoNombre;
    private final BigDecimal cantidad;
    private final BigDecimal precioUnitario;
    private final BigDecimal tarifaIva;
    private final BigDecimal descuento;
    private final BigDecimal subtotal;
    private final BigDecimal montoIva;
    private final BigDecimal total;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final BigDecimal cantidadDevuelta;

    public DetalleVentaResponse(Long id, Long productoId, String productoNombre, BigDecimal cantidad,
                                 BigDecimal precioUnitario, BigDecimal tarifaIva, BigDecimal descuento,
                                 BigDecimal subtotal, BigDecimal montoIva, BigDecimal total,
                                 BigDecimal cantidadDevuelta) {
        this.id = id;
        this.productoId = productoId;
        this.productoNombre = productoNombre;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.tarifaIva = tarifaIva;
        this.descuento = descuento;
        this.subtotal = subtotal;
        this.montoIva = montoIva;
        this.total = total;
        this.cantidadDevuelta = cantidadDevuelta;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
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

    public BigDecimal getTarifaIva() {
        return tarifaIva;
    }

    public BigDecimal getDescuento() {
        return descuento;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getMontoIva() {
        return montoIva;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public BigDecimal getCantidadDevuelta() {
        return cantidadDevuelta;
    }

    public static class Builder {
        private Long id;
        private Long productoId;
        private String productoNombre;
        private BigDecimal cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal tarifaIva;
        private BigDecimal descuento;
        private BigDecimal subtotal;
        private BigDecimal montoIva;
        private BigDecimal total;
        private BigDecimal cantidadDevuelta;

        public Builder id(Long id) {
            this.id = id;
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

        public Builder tarifaIva(BigDecimal tarifaIva) {
            this.tarifaIva = tarifaIva;
            return this;
        }

        public Builder descuento(BigDecimal descuento) {
            this.descuento = descuento;
            return this;
        }

        public Builder subtotal(BigDecimal subtotal) {
            this.subtotal = subtotal;
            return this;
        }

        public Builder montoIva(BigDecimal montoIva) {
            this.montoIva = montoIva;
            return this;
        }

        public Builder total(BigDecimal total) {
            this.total = total;
            return this;
        }

        public Builder cantidadDevuelta(BigDecimal cantidadDevuelta) {
            this.cantidadDevuelta = cantidadDevuelta;
            return this;
        }

        public DetalleVentaResponse build() {
            return new DetalleVentaResponse(id, productoId, productoNombre, cantidad, precioUnitario, tarifaIva,
                    descuento, subtotal, montoIva, total, cantidadDevuelta);
        }
    }
}
