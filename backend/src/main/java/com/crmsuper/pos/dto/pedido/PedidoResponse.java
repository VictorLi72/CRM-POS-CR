package com.crmsuper.pos.dto.pedido;

import com.crmsuper.pos.model.enums.EstadoPedido;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class PedidoResponse {
    private final Long id;
    private final String cajeroNombre;
    private final Long clienteId;
    private final String clienteNombre;
    private final String clienteTelefono;
    private final EstadoPedido estado;
    private final String notas;
    private final BigDecimal total;
    private final Instant creadoEn;
    private final Instant actualizadoEn;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final List<PedidoItemResponse> items;

    public PedidoResponse(Long id, String cajeroNombre, Long clienteId, String clienteNombre,
                           String clienteTelefono, EstadoPedido estado, String notas, BigDecimal total,
                           Instant creadoEn, Instant actualizadoEn, List<PedidoItemResponse> items) {
        this.id = id;
        this.cajeroNombre = cajeroNombre;
        this.clienteId = clienteId;
        this.clienteNombre = clienteNombre;
        this.clienteTelefono = clienteTelefono;
        this.estado = estado;
        this.notas = notas;
        this.total = total;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
        this.items = items;
    }

    public Long getId() { return id; }
    public String getCajeroNombre() { return cajeroNombre; }
    public Long getClienteId() { return clienteId; }
    public String getClienteNombre() { return clienteNombre; }
    public String getClienteTelefono() { return clienteTelefono; }
    public EstadoPedido getEstado() { return estado; }
    public String getNotas() { return notas; }
    public BigDecimal getTotal() { return total; }
    public Instant getCreadoEn() { return creadoEn; }
    public Instant getActualizadoEn() { return actualizadoEn; }
    public List<PedidoItemResponse> getItems() { return items; }
}
