package com.crmsuper.pos.model;

import com.crmsuper.pos.model.enums.EstadoVenta;
import com.crmsuper.pos.model.enums.MetodoPago;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ventas")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long folio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "descuento_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal descuentoTotal = BigDecimal.ZERO;

    @Column(name = "iva_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal ivaTotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_pago", nullable = false, length = 20)
    private MetodoPago metodoPago;

    @Column(name = "monto_recibido", precision = 12, scale = 2)
    private BigDecimal montoRecibido;

    @Column(precision = 12, scale = 2)
    private BigDecimal vuelto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoVenta estado = EstadoVenta.completada;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    public Venta() {
    }

    public Venta(Long id, Long folio, Usuario usuario, Cliente cliente, BigDecimal subtotal,
                 BigDecimal descuentoTotal, BigDecimal ivaTotal, BigDecimal total, MetodoPago metodoPago,
                 BigDecimal montoRecibido, BigDecimal vuelto, EstadoVenta estado, Instant creadoEn) {
        this.id = id;
        this.folio = folio;
        this.usuario = usuario;
        this.cliente = cliente;
        this.subtotal = subtotal;
        this.descuentoTotal = descuentoTotal;
        this.ivaTotal = ivaTotal;
        this.total = total;
        this.metodoPago = metodoPago;
        this.montoRecibido = montoRecibido;
        this.vuelto = vuelto;
        this.estado = estado;
        this.creadoEn = creadoEn;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFolio() {
        return folio;
    }

    public void setFolio(Long folio) {
        this.folio = folio;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDescuentoTotal() {
        return descuentoTotal;
    }

    public void setDescuentoTotal(BigDecimal descuentoTotal) {
        this.descuentoTotal = descuentoTotal;
    }

    public BigDecimal getIvaTotal() {
        return ivaTotal;
    }

    public void setIvaTotal(BigDecimal ivaTotal) {
        this.ivaTotal = ivaTotal;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public MetodoPago getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(MetodoPago metodoPago) {
        this.metodoPago = metodoPago;
    }

    public BigDecimal getMontoRecibido() {
        return montoRecibido;
    }

    public void setMontoRecibido(BigDecimal montoRecibido) {
        this.montoRecibido = montoRecibido;
    }

    public BigDecimal getVuelto() {
        return vuelto;
    }

    public void setVuelto(BigDecimal vuelto) {
        this.vuelto = vuelto;
    }

    public EstadoVenta getEstado() {
        return estado;
    }

    public void setEstado(EstadoVenta estado) {
        this.estado = estado;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }

    public static class Builder {
        private Long id;
        private Long folio;
        private Usuario usuario;
        private Cliente cliente;
        private BigDecimal subtotal;
        private BigDecimal descuentoTotal = BigDecimal.ZERO;
        private BigDecimal ivaTotal;
        private BigDecimal total;
        private MetodoPago metodoPago;
        private BigDecimal montoRecibido;
        private BigDecimal vuelto;
        private EstadoVenta estado = EstadoVenta.completada;
        private Instant creadoEn;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder folio(Long folio) {
            this.folio = folio;
            return this;
        }

        public Builder usuario(Usuario usuario) {
            this.usuario = usuario;
            return this;
        }

        public Builder cliente(Cliente cliente) {
            this.cliente = cliente;
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

        public Venta build() {
            return new Venta(id, folio, usuario, cliente, subtotal, descuentoTotal, ivaTotal, total, metodoPago,
                    montoRecibido, vuelto, estado, creadoEn);
        }
    }
}
