package com.crmsuper.pos.dto.compra;

import java.math.BigDecimal;

public class OrdenCompraItemResponse {
    private final Long id;
    private final Long productoId;
    private final String productoNombre;
    private final BigDecimal cantidad;
    private final BigDecimal precioUnitario;
    private final BigDecimal total;
    private final String nota;

    public OrdenCompraItemResponse(Long id, Long productoId, String productoNombre,
                                    BigDecimal cantidad, BigDecimal precioUnitario,
                                    BigDecimal total, String nota) {
        this.id = id;
        this.productoId = productoId;
        this.productoNombre = productoNombre;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.total = total;
        this.nota = nota;
    }

    public Long getId() { return id; }
    public Long getProductoId() { return productoId; }
    public String getProductoNombre() { return productoNombre; }
    public BigDecimal getCantidad() { return cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public BigDecimal getTotal() { return total; }
    public String getNota() { return nota; }
}
