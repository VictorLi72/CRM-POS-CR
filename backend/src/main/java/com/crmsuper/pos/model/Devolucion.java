package com.crmsuper.pos.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "devoluciones")
public class Devolucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venta_id", nullable = false)
    private Venta venta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    private String motivo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    public Devolucion() {
    }

    public Devolucion(Long id, Venta venta, Usuario usuario, String motivo, BigDecimal total, Instant creadoEn) {
        this.id = id;
        this.venta = venta;
        this.usuario = usuario;
        this.motivo = motivo;
        this.total = total;
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

    public Venta getVenta() {
        return venta;
    }

    public void setVenta(Venta venta) {
        this.venta = venta;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }

    public static class Builder {
        private Long id;
        private Venta venta;
        private Usuario usuario;
        private String motivo;
        private BigDecimal total;
        private Instant creadoEn;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder venta(Venta venta) {
            this.venta = venta;
            return this;
        }

        public Builder usuario(Usuario usuario) {
            this.usuario = usuario;
            return this;
        }

        public Builder motivo(String motivo) {
            this.motivo = motivo;
            return this;
        }

        public Builder total(BigDecimal total) {
            this.total = total;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public Devolucion build() {
            return new Devolucion(id, venta, usuario, motivo, total, creadoEn);
        }
    }
}
