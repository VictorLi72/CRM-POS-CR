package com.crmsuper.pos.dto;

import java.math.BigDecimal;

public class ProductoRequest {
    private String codigoBarras;
    private String nombre;
    private Long categoriaId;
    private BigDecimal precioCosto;
    private BigDecimal precioVenta;
    private BigDecimal tarifaIva;
    private String codigoCabys;
    private String unidadMedida;
    private BigDecimal existencia;
    private BigDecimal existenciaMinima;
    private Boolean accesoRapido;

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public void setCodigoBarras(String codigoBarras) {
        this.codigoBarras = codigoBarras;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Long getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(Long categoriaId) {
        this.categoriaId = categoriaId;
    }

    public BigDecimal getPrecioCosto() {
        return precioCosto;
    }

    public void setPrecioCosto(BigDecimal precioCosto) {
        this.precioCosto = precioCosto;
    }

    public BigDecimal getPrecioVenta() {
        return precioVenta;
    }

    public void setPrecioVenta(BigDecimal precioVenta) {
        this.precioVenta = precioVenta;
    }

    public BigDecimal getTarifaIva() {
        return tarifaIva;
    }

    public void setTarifaIva(BigDecimal tarifaIva) {
        this.tarifaIva = tarifaIva;
    }

    public String getCodigoCabys() {
        return codigoCabys;
    }

    public void setCodigoCabys(String codigoCabys) {
        this.codigoCabys = codigoCabys;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public void setUnidadMedida(String unidadMedida) {
        this.unidadMedida = unidadMedida;
    }

    public BigDecimal getExistencia() {
        return existencia;
    }

    public void setExistencia(BigDecimal existencia) {
        this.existencia = existencia;
    }

    public BigDecimal getExistenciaMinima() {
        return existenciaMinima;
    }

    public void setExistenciaMinima(BigDecimal existenciaMinima) {
        this.existenciaMinima = existenciaMinima;
    }

    public Boolean getAccesoRapido() {
        return accesoRapido;
    }

    public void setAccesoRapido(Boolean accesoRapido) {
        this.accesoRapido = accesoRapido;
    }
}
