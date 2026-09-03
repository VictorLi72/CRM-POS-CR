package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.TipoPromocion;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public class PromocionResponse {
    private final Long id;
    private final Long productoId;
    private final String productoNombre;
    private final BigDecimal precioVenta;
    private final TipoPromocion tipo;
    private final BigDecimal valor;
    private final LocalDate fechaInicio;
    private final LocalDate fechaFin;
    private final boolean activo;
    private final boolean vigenteHoy;
    private final Instant creadoEn;

    public PromocionResponse(Long id, Long productoId, String productoNombre, BigDecimal precioVenta,
                              TipoPromocion tipo, BigDecimal valor, LocalDate fechaInicio, LocalDate fechaFin,
                              boolean activo, boolean vigenteHoy, Instant creadoEn) {
        this.id = id;
        this.productoId = productoId;
        this.productoNombre = productoNombre;
        this.precioVenta = precioVenta;
        this.tipo = tipo;
        this.valor = valor;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.activo = activo;
        this.vigenteHoy = vigenteHoy;
        this.creadoEn = creadoEn;
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

    public BigDecimal getPrecioVenta() {
        return precioVenta;
    }

    public TipoPromocion getTipo() {
        return tipo;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public boolean isActivo() {
        return activo;
    }

    public boolean isVigenteHoy() {
        return vigenteHoy;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public static class Builder {
        private Long id;
        private Long productoId;
        private String productoNombre;
        private BigDecimal precioVenta;
        private TipoPromocion tipo;
        private BigDecimal valor;
        private LocalDate fechaInicio;
        private LocalDate fechaFin;
        private boolean activo;
        private boolean vigenteHoy;
        private Instant creadoEn;

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

        public Builder precioVenta(BigDecimal precioVenta) {
            this.precioVenta = precioVenta;
            return this;
        }

        public Builder tipo(TipoPromocion tipo) {
            this.tipo = tipo;
            return this;
        }

        public Builder valor(BigDecimal valor) {
            this.valor = valor;
            return this;
        }

        public Builder fechaInicio(LocalDate fechaInicio) {
            this.fechaInicio = fechaInicio;
            return this;
        }

        public Builder fechaFin(LocalDate fechaFin) {
            this.fechaFin = fechaFin;
            return this;
        }

        public Builder activo(boolean activo) {
            this.activo = activo;
            return this;
        }

        public Builder vigenteHoy(boolean vigenteHoy) {
            this.vigenteHoy = vigenteHoy;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public PromocionResponse build() {
            return new PromocionResponse(id, productoId, productoNombre, precioVenta, tipo, valor, fechaInicio,
                    fechaFin, activo, vigenteHoy, creadoEn);
        }
    }
}
