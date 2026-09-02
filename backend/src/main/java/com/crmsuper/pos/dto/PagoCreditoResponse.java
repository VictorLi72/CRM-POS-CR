package com.crmsuper.pos.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class PagoCreditoResponse {
    private final Long id;
    private final Long clienteId;
    private final Long ventaId;
    private final BigDecimal monto;
    private final Long usuarioId;
    private final Instant creadoEn;

    public PagoCreditoResponse(Long id, Long clienteId, Long ventaId, BigDecimal monto, Long usuarioId,
                                Instant creadoEn) {
        this.id = id;
        this.clienteId = clienteId;
        this.ventaId = ventaId;
        this.monto = monto;
        this.usuarioId = usuarioId;
        this.creadoEn = creadoEn;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public Long getVentaId() {
        return ventaId;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public static class Builder {
        private Long id;
        private Long clienteId;
        private Long ventaId;
        private BigDecimal monto;
        private Long usuarioId;
        private Instant creadoEn;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder clienteId(Long clienteId) {
            this.clienteId = clienteId;
            return this;
        }

        public Builder ventaId(Long ventaId) {
            this.ventaId = ventaId;
            return this;
        }

        public Builder monto(BigDecimal monto) {
            this.monto = monto;
            return this;
        }

        public Builder usuarioId(Long usuarioId) {
            this.usuarioId = usuarioId;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public PagoCreditoResponse build() {
            return new PagoCreditoResponse(id, clienteId, ventaId, monto, usuarioId, creadoEn);
        }
    }
}
