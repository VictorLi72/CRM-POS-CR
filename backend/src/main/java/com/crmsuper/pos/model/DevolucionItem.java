package com.crmsuper.pos.model;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;

@Entity
@Table(name = "devolucion_items")
public class DevolucionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "devolucion_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Devolucion devolucion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "detalle_venta_id", nullable = false)
    private DetalleVenta detalleVenta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "producto_nombre", nullable = false)
    private String productoNombre;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    public DevolucionItem() {
    }

    public DevolucionItem(Long id, Devolucion devolucion, DetalleVenta detalleVenta, Producto producto,
                           String productoNombre, BigDecimal cantidad, BigDecimal precioUnitario, BigDecimal total) {
        this.id = id;
        this.devolucion = devolucion;
        this.detalleVenta = detalleVenta;
        this.producto = producto;
        this.productoNombre = productoNombre;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
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

    public Devolucion getDevolucion() {
        return devolucion;
    }

    public void setDevolucion(Devolucion devolucion) {
        this.devolucion = devolucion;
    }

    public DetalleVenta getDetalleVenta() {
        return detalleVenta;
    }

    public void setDetalleVenta(DetalleVenta detalleVenta) {
        this.detalleVenta = detalleVenta;
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

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public static class Builder {
        private Long id;
        private Devolucion devolucion;
        private DetalleVenta detalleVenta;
        private Producto producto;
        private String productoNombre;
        private BigDecimal cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal total;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder devolucion(Devolucion devolucion) {
            this.devolucion = devolucion;
            return this;
        }

        public Builder detalleVenta(DetalleVenta detalleVenta) {
            this.detalleVenta = detalleVenta;
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

        public Builder total(BigDecimal total) {
            this.total = total;
            return this;
        }

        public DevolucionItem build() {
            return new DevolucionItem(id, devolucion, detalleVenta, producto, productoNombre, cantidad,
                    precioUnitario, total);
        }
    }
}
