package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.Rol;

public class UserInfo {
    private final Long id;
    private final String usuario;
    private final String nombreCompleto;
    private final Rol rol;

    public UserInfo(Long id, String usuario, String nombreCompleto, Rol rol) {
        this.id = id;
        this.usuario = usuario;
        this.nombreCompleto = nombreCompleto;
        this.rol = rol;
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

    public static class Builder {
        private Long id;
        private String usuario;
        private String nombreCompleto;
        private Rol rol;

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

        public UserInfo build() {
            return new UserInfo(id, usuario, nombreCompleto, rol);
        }
    }
}
