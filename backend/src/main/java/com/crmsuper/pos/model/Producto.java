package com.crmsuper.pos.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_barras", unique = true)
    private String codigoBarras;

    @Column(nullable = false)
    private String nombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @Column(name = "precio_costo", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioCosto = BigDecimal.ZERO;

    @Column(name = "precio_venta", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioVenta = BigDecimal.ZERO;

    @Column(name = "tarifa_iva", nullable = false, precision = 5, scale = 2)
    private BigDecimal tarifaIva = BigDecimal.valueOf(13);

    @Column(name = "codigo_cabys")
    private String codigoCabys;

    @Column(name = "unidad_medida", nullable = false)
    private String unidadMedida = "unidad";

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal existencia = BigDecimal.ZERO;

    @Column(name = "existencia_minima", nullable = false, precision = 12, scale = 3)
    private BigDecimal existenciaMinima = BigDecimal.valueOf(5);

    @Column(name = "acceso_rapido", nullable = false)
    private boolean accesoRapido = false;

    @Column(nullable = false)
    private boolean activo = true;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    public Producto() {
    }

    public Producto(Long id, String codigoBarras, String nombre, Categoria categoria, BigDecimal precioCosto,
                     BigDecimal precioVenta, BigDecimal tarifaIva, String codigoCabys, String unidadMedida,
                     BigDecimal existencia, BigDecimal existenciaMinima, boolean accesoRapido, boolean activo,
                     Instant creadoEn, Instant actualizadoEn) {
        this.id = id;
        this.codigoBarras = codigoBarras;
        this.nombre = nombre;
        this.categoria = categoria;
        this.precioCosto = precioCosto;
        this.precioVenta = precioVenta;
        this.tarifaIva = tarifaIva;
        this.codigoCabys = codigoCabys;
        this.unidadMedida = unidadMedida;
        this.existencia = existencia;
        this.existenciaMinima = existenciaMinima;
        this.accesoRapido = accesoRapido;
        this.activo = activo;
        this.creadoEn = creadoEn;
        this.actualizadoEn = actualizadoEn;
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

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public void setCodigoBarras(String codigoBarras) {
        this.codigoBarras = codigoBarras;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public BigDecimal getPrecioCosto() {
        return precioCosto;
    }

    public void setPrecioCosto(BigDecimal precioCosto) {
        this.precioCosto = precioCosto;
    }

    public BigDecimal getPrecioVenta() {
        return precioVenta;
    }

    public void setPrecioVenta(BigDecimal precioVenta) {
        this.precioVenta = precioVenta;
    }

    public BigDecimal getTarifaIva() {
        return tarifaIva;
    }

    public void setTarifaIva(BigDecimal tarifaIva) {
        this.tarifaIva = tarifaIva;
    }

    public String getCodigoCabys() {
        return codigoCabys;
    }

    public void setCodigoCabys(String codigoCabys) {
        this.codigoCabys = codigoCabys;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public void setUnidadMedida(String unidadMedida) {
        this.unidadMedida = unidadMedida;
    }

    public BigDecimal getExistencia() {
        return existencia;
    }

    public void setExistencia(BigDecimal existencia) {
        this.existencia = existencia;
    }

    public BigDecimal getExistenciaMinima() {
        return existenciaMinima;
    }

    public void setExistenciaMinima(BigDecimal existenciaMinima) {
        this.existenciaMinima = existenciaMinima;
    }

    public boolean isAccesoRapido() {
        return accesoRapido;
    }

    public void setAccesoRapido(boolean accesoRapido) {
        this.accesoRapido = accesoRapido;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }

    public Instant getActualizadoEn() {
        return actualizadoEn;
    }

    public void setActualizadoEn(Instant actualizadoEn) {
        this.actualizadoEn = actualizadoEn;
    }

    public static class Builder {
        private Long id;
        private String codigoBarras;
        private String nombre;
        private Categoria categoria;
        private BigDecimal precioCosto = BigDecimal.ZERO;
        private BigDecimal precioVenta = BigDecimal.ZERO;
        private BigDecimal tarifaIva = BigDecimal.valueOf(13);
        private String codigoCabys;
        private String unidadMedida = "unidad";
        private BigDecimal existencia = BigDecimal.ZERO;
        private BigDecimal existenciaMinima = BigDecimal.valueOf(5);
        private boolean accesoRapido = false;
        private boolean activo = true;
        private Instant creadoEn;
        private Instant actualizadoEn;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder codigoBarras(String codigoBarras) {
            this.codigoBarras = codigoBarras;
            return this;
        }

        public Builder nombre(String nombre) {
            this.nombre = nombre;
            return this;
        }

        public Builder categoria(Categoria categoria) {
            this.categoria = categoria;
            return this;
        }

        public Builder precioCosto(BigDecimal precioCosto) {
            this.precioCosto = precioCosto;
            return this;
        }

        public Builder precioVenta(BigDecimal precioVenta) {
            this.precioVenta = precioVenta;
            return this;
        }

        public Builder tarifaIva(BigDecimal tarifaIva) {
            this.tarifaIva = tarifaIva;
            return this;
        }

        public Builder codigoCabys(String codigoCabys) {
            this.codigoCabys = codigoCabys;
            return this;
        }

        public Builder unidadMedida(String unidadMedida) {
            this.unidadMedida = unidadMedida;
            return this;
        }

        public Builder existencia(BigDecimal existencia) {
            this.existencia = existencia;
            return this;
        }

        public Builder existenciaMinima(BigDecimal existenciaMinima) {
            this.existenciaMinima = existenciaMinima;
            return this;
        }

        public Builder accesoRapido(boolean accesoRapido) {
            this.accesoRapido = accesoRapido;
            return this;
        }

        public Builder activo(boolean activo) {
            this.activo = activo;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public Builder actualizadoEn(Instant actualizadoEn) {
            this.actualizadoEn = actualizadoEn;
            return this;
        }

        public Producto build() {
            return new Producto(id, codigoBarras, nombre, categoria, precioCosto, precioVenta, tarifaIva,
                    codigoCabys, unidadMedida, existencia, existenciaMinima, accesoRapido, activo, creadoEn,
                    actualizadoEn);
        }
    }
}
