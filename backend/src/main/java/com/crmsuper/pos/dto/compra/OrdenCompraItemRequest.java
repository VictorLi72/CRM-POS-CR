package com.crmsuper.pos.dto.compra;

import java.math.BigDecimal;

public class OrdenCompraItemRequest {
    private Long productoId;
    private String productoNombre;
    private BigDecimal cantidad;
    private BigDecimal precioUnitario;
    private String nota;

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }
    public String getProductoNombre() { return productoNombre; }
    public void setProductoNombre(String productoNombre) { this.productoNombre = productoNombre; }
    public BigDecimal getCantidad() { return cantidad; }
    public void setCantidad(BigDecimal cantidad) { this.cantidad = cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }
    public String getNota() { return nota; }
    public void setNota(String nota) { this.nota = nota; }
}
