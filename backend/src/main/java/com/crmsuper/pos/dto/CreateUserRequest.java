package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.Rol;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateUserRequest {

    @NotBlank(message = "Todos los campos son requeridos")
    private String username;

    @NotBlank(message = "Todos los campos son requeridos")
    private String password;

    @NotBlank(message = "Todos los campos son requeridos")
    private String nombreCompleto;

    @NotNull(message = "Todos los campos son requeridos")
    private Rol rol;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public Rol getRol() {
        return rol;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }
}
