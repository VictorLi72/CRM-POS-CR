package com.crmsuper.pos.dto;

import jakarta.validation.constraints.NotBlank;

public class CategoriaRequest {

    @NotBlank(message = "El nombre es requerido")
    private String nombre;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
