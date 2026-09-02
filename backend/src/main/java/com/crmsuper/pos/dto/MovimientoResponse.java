package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.TipoMovimiento;

import java.math.BigDecimal;
import java.time.Instant;

public class MovimientoResponse {
    private final Long id;
    private final Long productoId;
    private final TipoMovimiento tipo;
    private final BigDecimal cantidad;
    private final String referencia;
    private final Long usuarioId;
    private final String usuarioNombre;
    private final Instant creadoEn;

    public MovimientoResponse(Long id, Long productoId, TipoMovimiento tipo, BigDecimal cantidad, String referencia,
                               Long usuarioId, String usuarioNombre, Instant creadoEn) {
        this.id = id;
        this.productoId = productoId;
        this.tipo = tipo;
        this.cantidad = cantidad;
        this.referencia = referencia;
        this.usuarioId = usuarioId;
        this.usuarioNombre = usuarioNombre;
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

    public TipoMovimiento getTipo() {
        return tipo;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public String getReferencia() {
        return referencia;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public String getUsuarioNombre() {
        return usuarioNombre;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public static class Builder {
        private Long id;
        private Long productoId;
        private TipoMovimiento tipo;
        private BigDecimal cantidad;
        private String referencia;
        private Long usuarioId;
        private String usuarioNombre;
        private Instant creadoEn;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder productoId(Long productoId) {
            this.productoId = productoId;
            return this;
        }

        public Builder tipo(TipoMovimiento tipo) {
            this.tipo = tipo;
            return this;
        }

        public Builder cantidad(BigDecimal cantidad) {
            this.cantidad = cantidad;
            return this;
        }

        public Builder referencia(String referencia) {
            this.referencia = referencia;
            return this;
        }

        public Builder usuarioId(Long usuarioId) {
            this.usuarioId = usuarioId;
            return this;
        }

        public Builder usuarioNombre(String usuarioNombre) {
            this.usuarioNombre = usuarioNombre;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public MovimientoResponse build() {
            return new MovimientoResponse(id, productoId, tipo, cantidad, referencia, usuarioId, usuarioNombre,
                    creadoEn);
        }
    }
}
