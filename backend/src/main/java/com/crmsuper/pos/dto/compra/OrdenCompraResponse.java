package com.crmsuper.pos.dto.compra;

import com.crmsuper.pos.model.enums.EstadoOrdenCompra;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class OrdenCompraResponse {
    private final Long id;
    private final String cajeroNombre;
    private final Long proveedorId;
    private final String proveedorNombre;
    private final EstadoOrdenCompra estado;
    private final String notas;
    private final BigDecimal total;
    private final Instant creadoEn;
    private final Instant actualizadoEn;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final List<OrdenCompraItemResponse> items;

    public OrdenCompraResponse(Long id, String cajeroNombre, Long proveedorId, String proveedorNombre,
                                EstadoOrdenCompra estado, String notas, BigDecimal total,
                                Instant creadoEn, Instant actualizadoEn,
                                List<OrdenCompraItemResponse> items) {
        this.id = id;
        this.cajeroNombre = cajeroNombre;
        this.proveedorId = proveedorId;
        this.proveedorNombre = proveedorNombre;
        this.estado = estado;
        this.notas = notas;
        this.total = total;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
        this.items = items;
    }

    public Long getId() { return id; }
    public String getCajeroNombre() { return cajeroNombre; }
    public Long getProveedorId() { return proveedorId; }
    public String getProveedorNombre() { return proveedorNombre; }
    public EstadoOrdenCompra getEstado() { return estado; }
    public String getNotas() { return notas; }
    public BigDecimal getTotal() { return total; }
    public Instant getCreadoEn() { return creadoEn; }
    public Instant getActualizadoEn() { return actualizadoEn; }
    public List<OrdenCompraItemResponse> getItems() { return items; }
}
