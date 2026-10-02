package com.crmsuper.pos.dto.pedido;

import java.util.List;

public class PedidoRequest {
    private Long clienteId;
    private String clienteNombre;
    private String clienteTelefono;
    private String notas;
    private List<PedidoItemRequest> items;

    public Long getClienteId() { return clienteId; }
    public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }
    public String getClienteTelefono() { return clienteTelefono; }
    public void setClienteTelefono(String clienteTelefono) { this.clienteTelefono = clienteTelefono; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public List<PedidoItemRequest> getItems() { return items; }
    public void setItems(List<PedidoItemRequest> items) { this.items = items; }
}
