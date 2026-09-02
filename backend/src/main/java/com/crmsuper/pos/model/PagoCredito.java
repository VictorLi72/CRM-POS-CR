package com.crmsuper.pos.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "pagos_credito")
public class PagoCredito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_id")
    private Venta venta;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    public PagoCredito() {
    }

    public PagoCredito(Long id, Cliente cliente, Venta venta, BigDecimal monto, Usuario usuario, Instant creadoEn) {
        this.id = id;
        this.cliente = cliente;
        this.venta = venta;
        this.monto = monto;
        this.usuario = usuario;
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

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Venta getVenta() {
        return venta;
    }

    public void setVenta(Venta venta) {
        this.venta = venta;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }

    public static class Builder {
        private Long id;
        private Cliente cliente;
        private Venta venta;
        private BigDecimal monto;
        private Usuario usuario;
        private Instant creadoEn;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder cliente(Cliente cliente) {
            this.cliente = cliente;
            return this;
        }

        public Builder venta(Venta venta) {
            this.venta = venta;
            return this;
        }

        public Builder monto(BigDecimal monto) {
            this.monto = monto;
            return this;
        }

        public Builder usuario(Usuario usuario) {
            this.usuario = usuario;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public PagoCredito build() {
            return new PagoCredito(id, cliente, venta, monto, usuario, creadoEn);
        }
    }
}
