package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.Rol;

import java.time.Instant;

public class UsuarioResponse {
    private final Long id;
    private final String usuario;
    private final String nombreCompleto;
    private final Rol rol;
    private final boolean activo;
    private final Instant creadoEn;

    public UsuarioResponse(Long id, String usuario, String nombreCompleto, Rol rol, boolean activo,
                            Instant creadoEn) {
        this.id = id;
        this.usuario = usuario;
        this.nombreCompleto = nombreCompleto;
        this.rol = rol;
        this.activo = activo;
        this.creadoEn = creadoEn;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public String getUsuario() {
        return usuario;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public Rol getRol() {
        return rol;
    }

    public boolean isActivo() {
        return activo;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public static class Builder {
        private Long id;
        private String usuario;
        private String nombreCompleto;
        private Rol rol;
        private boolean activo;
        private Instant creadoEn;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder usuario(String usuario) {
            this.usuario = usuario;
            return this;
        }

        public Builder nombreCompleto(String nombreCompleto) {
            this.nombreCompleto = nombreCompleto;
            return this;
        }

        public Builder rol(Rol rol) {
            this.rol = rol;
            return this;
        }

        public Builder activo(boolean activo) {
            this.activo = activo;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public UsuarioResponse build() {
            return new UsuarioResponse(id, usuario, nombreCompleto, rol, activo, creadoEn);
        }
    }
}
