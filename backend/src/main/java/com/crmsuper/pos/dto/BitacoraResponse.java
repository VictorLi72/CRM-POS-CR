package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.TipoAccion;

import java.time.Instant;

public class BitacoraResponse {
    private final Long id;
    private final Long usuarioId;
    private final String usuarioNombre;
    private final TipoAccion accion;
    private final String entidad;
    private final Long entidadId;
    private final String detalle;
    private final Instant creadoEn;

    public BitacoraResponse(Long id, Long usuarioId, String usuarioNombre, TipoAccion accion, String entidad,
                             Long entidadId, String detalle, Instant creadoEn) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.usuarioNombre = usuarioNombre;
        this.accion = accion;
        this.entidad = entidad;
        this.entidadId = entidadId;
        this.detalle = detalle;
        this.creadoEn = creadoEn;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public String getUsuarioNombre() {
        return usuarioNombre;
    }

    public TipoAccion getAccion() {
        return accion;
    }

    public String getEntidad() {
        return entidad;
    }

    public Long getEntidadId() {
        return entidadId;
    }

    public String getDetalle() {
        return detalle;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public static class Builder {
        private Long id;
        private Long usuarioId;
        private String usuarioNombre;
        private TipoAccion accion;
        private String entidad;
        private Long entidadId;
        private String detalle;
        private Instant creadoEn;

        public Builder id(Long id) {
            this.id = id;
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

        public Builder accion(TipoAccion accion) {
            this.accion = accion;
            return this;
        }

        public Builder entidad(String entidad) {
            this.entidad = entidad;
            return this;
        }

        public Builder entidadId(Long entidadId) {
            this.entidadId = entidadId;
            return this;
        }

        public Builder detalle(String detalle) {
            this.detalle = detalle;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public BitacoraResponse build() {
            return new BitacoraResponse(id, usuarioId, usuarioNombre, accion, entidad, entidadId, detalle, creadoEn);
        }
    }
}
