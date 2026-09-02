package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.TipoDescuento;

import java.math.BigDecimal;

public class DescuentoRequest {
    private String nombre;
    private TipoDescuento tipo;
    private BigDecimal valor;
    private Boolean activo;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public TipoDescuento getTipo() {
        return tipo;
    }

    public void setTipo(TipoDescuento tipo) {
        this.tipo = tipo;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
