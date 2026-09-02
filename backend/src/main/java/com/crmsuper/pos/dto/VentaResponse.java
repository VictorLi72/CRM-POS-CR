package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.EstadoVenta;
import com.crmsuper.pos.model.enums.MetodoPago;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class VentaResponse {
    private final Long id;
    private final Long folio;
    private final Long usuarioId;
    private final String cajeroNombre;
    private final Long clienteId;
    private final String clienteNombre;
    private final BigDecimal subtotal;
    private final BigDecimal descuentoTotal;
    private final BigDecimal ivaTotal;
    private final BigDecimal total;
    private final MetodoPago metodoPago;
    private final BigDecimal montoRecibido;
    private final BigDecimal vuelto;
    private final EstadoVenta estado;
    private final Instant creadoEn;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final List<DetalleVentaResponse> items;

    public VentaResponse(Long id, Long folio, Long usuarioId, String cajeroNombre, Long clienteId,
                          String clienteNombre, BigDecimal subtotal, BigDecimal descuentoTotal, BigDecimal ivaTotal,
                          BigDecimal total, MetodoPago metodoPago, BigDecimal montoRecibido, BigDecimal vuelto,
                          EstadoVenta estado, Instant creadoEn, List<DetalleVentaResponse> items) {
        this.id = id;
        this.folio = folio;
        this.usuarioId = usuarioId;
        this.cajeroNombre = cajeroNombre;
        this.clienteId = clienteId;
        this.clienteNombre = clienteNombre;
        this.subtotal = subtotal;
        this.descuentoTotal = descuentoTotal;
        this.ivaTotal = ivaTotal;
        this.total = total;
        this.metodoPago = metodoPago;
        this.montoRecibido = montoRecibido;
        this.vuelto = vuelto;
        this.estado = estado;
        this.creadoEn = creadoEn;
        this.items = items;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public Long getFolio() {
        return folio;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public String getCajeroNombre() {
        return cajeroNombre;
    }

    public Long getClienteId() {
        return clienteId;
    }

    public String getClienteNombre() {
        return clienteNombre;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getDescuentoTotal() {
        return descuentoTotal;
    }

    public BigDecimal getIvaTotal() {
        return ivaTotal;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public MetodoPago getMetodoPago() {
        return metodoPago;
    }

    public BigDecimal getMontoRecibido() {
        return montoRecibido;
    }

    public BigDecimal getVuelto() {
        return vuelto;
    }

    public EstadoVenta getEstado() {
        return estado;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public List<DetalleVentaResponse> getItems() {
        return items;
    }

    public static class Builder {
        private Long id;
        private Long folio;
        private Long usuarioId;
        private String cajeroNombre;
        private Long clienteId;
        private String clienteNombre;
        private BigDecimal subtotal;
        private BigDecimal descuentoTotal;
        private BigDecimal ivaTotal;
        private BigDecimal total;
        private MetodoPago metodoPago;
        private BigDecimal montoRecibido;
        private BigDecimal vuelto;
        private EstadoVenta estado;
        private Instant creadoEn;
        private List<DetalleVentaResponse> items;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder folio(Long folio) {
            this.folio = folio;
            return this;
        }

        public Builder usuarioId(Long usuarioId) {
            this.usuarioId = usuarioId;
            return this;
        }

        public Builder cajeroNombre(String cajeroNombre) {
            this.cajeroNombre = cajeroNombre;
            return this;
        }

        public Builder clienteId(Long clienteId) {
            this.clienteId = clienteId;
            return this;
        }

        public Builder clienteNombre(String clienteNombre) {
            this.clienteNombre = clienteNombre;
            return this;
        }

        public Builder subtotal(BigDecimal subtotal) {
            this.subtotal = subtotal;
            return this;
        }

        public Builder descuentoTotal(BigDecimal descuentoTotal) {
            this.descuentoTotal = descuentoTotal;
            return this;
        }

        public Builder ivaTotal(BigDecimal ivaTotal) {
            this.ivaTotal = ivaTotal;
            return this;
        }

        public Builder total(BigDecimal total) {
            this.total = total;
            return this;
        }

        public Builder metodoPago(MetodoPago metodoPago) {
            this.metodoPago = metodoPago;
            return this;
        }

        public Builder montoRecibido(BigDecimal montoRecibido) {
            this.montoRecibido = montoRecibido;
            return this;
        }

        public Builder vuelto(BigDecimal vuelto) {
            this.vuelto = vuelto;
            return this;
        }

        public Builder estado(EstadoVenta estado) {
            this.estado = estado;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public Builder items(List<DetalleVentaResponse> items) {
            this.items = items;
            return this;
        }

        public VentaResponse build() {
            return new VentaResponse(id, folio, usuarioId, cajeroNombre, clienteId, clienteNombre, subtotal,
                    descuentoTotal, ivaTotal, total, metodoPago, montoRecibido, vuelto, estado, creadoEn, items);
        }
    }
}
