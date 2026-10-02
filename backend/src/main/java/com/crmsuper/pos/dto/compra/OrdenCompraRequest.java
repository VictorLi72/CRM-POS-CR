package com.crmsuper.pos.dto.compra;

import java.util.List;

public class OrdenCompraRequest {
    private Long proveedorId;
    private String notas;
    private List<OrdenCompraItemRequest> items;

    public Long getProveedorId() { return proveedorId; }
    public void setProveedorId(Long proveedorId) { this.proveedorId = proveedorId; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public List<OrdenCompraItemRequest> getItems() { return items; }
    public void setItems(List<OrdenCompraItemRequest> items) { this.items = items; }
}
