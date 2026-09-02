package com.crmsuper.pos.model;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;

@Entity
@Table(name = "detalle_ventas")
public class DetalleVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venta_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Venta venta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "producto_nombre", nullable = false)
    private String productoNombre;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "tarifa_iva", nullable = false, precision = 5, scale = 2)
    private BigDecimal tarifaIva;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal descuento = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "monto_iva", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoIva;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    public DetalleVenta() {
    }

    public DetalleVenta(Long id, Venta venta, Producto producto, String productoNombre, BigDecimal cantidad,
                         BigDecimal precioUnitario, BigDecimal tarifaIva, BigDecimal descuento, BigDecimal subtotal,
                         BigDecimal montoIva, BigDecimal total) {
        this.id = id;
        this.venta = venta;
        this.producto = producto;
        this.productoNombre = productoNombre;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.tarifaIva = tarifaIva;
        this.descuento = descuento;
        this.subtotal = subtotal;
        this.montoIva = montoIva;
        this.total = total;
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

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public String getProductoNombre() {
        return productoNombre;
    }

    public void setProductoNombre(String productoNombre) {
        this.productoNombre = productoNombre;
    }

    public BigDecimal getCantidad() {
        return cantidad;
    }

    public void setCantidad(BigDecimal cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public BigDecimal getTarifaIva() {
        return tarifaIva;
    }

    public void setTarifaIva(BigDecimal tarifaIva) {
        this.tarifaIva = tarifaIva;
    }

    public BigDecimal getDescuento() {
        return descuento;
    }

    public void setDescuento(BigDecimal descuento) {
        this.descuento = descuento;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getMontoIva() {
        return montoIva;
    }

    public void setMontoIva(BigDecimal montoIva) {
        this.montoIva = montoIva;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public static class Builder {
        private Long id;
        private Venta venta;
        private Producto producto;
        private String productoNombre;
        private BigDecimal cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal tarifaIva;
        private BigDecimal descuento = BigDecimal.ZERO;
        private BigDecimal subtotal;
        private BigDecimal montoIva;
        private BigDecimal total;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder venta(Venta venta) {
            this.venta = venta;
            return this;
        }

        public Builder producto(Producto producto) {
            this.producto = producto;
            return this;
        }

        public Builder productoNombre(String productoNombre) {
            this.productoNombre = productoNombre;
            return this;
        }

        public Builder cantidad(BigDecimal cantidad) {
            this.cantidad = cantidad;
            return this;
        }

        public Builder precioUnitario(BigDecimal precioUnitario) {
            this.precioUnitario = precioUnitario;
            return this;
        }

        public Builder tarifaIva(BigDecimal tarifaIva) {
            this.tarifaIva = tarifaIva;
            return this;
        }

        public Builder descuento(BigDecimal descuento) {
            this.descuento = descuento;
            return this;
        }

        public Builder subtotal(BigDecimal subtotal) {
            this.subtotal = subtotal;
            return this;
        }

        public Builder montoIva(BigDecimal montoIva) {
            this.montoIva = montoIva;
            return this;
        }

        public Builder total(BigDecimal total) {
            this.total = total;
            return this;
        }

        public DetalleVenta build() {
            return new DetalleVenta(id, venta, producto, productoNombre, cantidad, precioUnitario, tarifaIva,
                    descuento, subtotal, montoIva, total);
        }
    }
}
