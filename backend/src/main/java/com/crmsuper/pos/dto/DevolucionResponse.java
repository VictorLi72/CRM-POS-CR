package com.crmsuper.pos.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class DevolucionResponse {
    private final Long id;
    private final Long ventaId;
    private final Long usuarioId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String usuarioNombre;

    private final String motivo;
    private final BigDecimal total;
    private final Instant creadoEn;
    private final List<DevolucionItemResponse> items;

    public DevolucionResponse(Long id, Long ventaId, Long usuarioId, String usuarioNombre, String motivo,
                               BigDecimal total, Instant creadoEn, List<DevolucionItemResponse> items) {
        this.id = id;
        this.ventaId = ventaId;
        this.usuarioId = usuarioId;
        this.usuarioNombre = usuarioNombre;
        this.motivo = motivo;
        this.total = total;
        this.creadoEn = creadoEn;
        this.items = items;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public Long getVentaId() {
        return ventaId;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public String getUsuarioNombre() {
        return usuarioNombre;
    }

    public String getMotivo() {
        return motivo;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public List<DevolucionItemResponse> getItems() {
        return items;
    }

    public static class Builder {
        private Long id;
        private Long ventaId;
        private Long usuarioId;
        private String usuarioNombre;
        private String motivo;
        private BigDecimal total;
        private Instant creadoEn;
        private List<DevolucionItemResponse> items;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder ventaId(Long ventaId) {
            this.ventaId = ventaId;
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

        public Builder motivo(String motivo) {
            this.motivo = motivo;
            return this;
        }

        public Builder total(BigDecimal total) {
            this.total = total;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public Builder items(List<DevolucionItemResponse> items) {
            this.items = items;
            return this;
        }

        public DevolucionResponse build() {
            return new DevolucionResponse(id, ventaId, usuarioId, usuarioNombre, motivo, total, creadoEn, items);
        }
    }
}
