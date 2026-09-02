package com.crmsuper.pos.dto;

import java.math.BigDecimal;
import java.time.Instant;

public class ProductoResponse {
    private final Long id;
    private final String codigoBarras;
    private final String nombre;
    private final Long categoriaId;
    private final String categoriaNombre;
    private final BigDecimal precioCosto;
    private final BigDecimal precioVenta;
    private final BigDecimal tarifaIva;
    private final String codigoCabys;
    private final String unidadMedida;
    private final BigDecimal existencia;
    private final BigDecimal existenciaMinima;
    private final boolean accesoRapido;
    private final boolean activo;
    private final Instant creadoEn;
    private final Instant actualizadoEn;

    public ProductoResponse(Long id, String codigoBarras, String nombre, Long categoriaId, String categoriaNombre,
                             BigDecimal precioCosto, BigDecimal precioVenta, BigDecimal tarifaIva,
                             String codigoCabys, String unidadMedida, BigDecimal existencia,
                             BigDecimal existenciaMinima, boolean accesoRapido, boolean activo, Instant creadoEn,
                             Instant actualizadoEn) {
        this.id = id;
        this.codigoBarras = codigoBarras;
        this.nombre = nombre;
        this.categoriaId = categoriaId;
        this.categoriaNombre = categoriaNombre;
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

    public String getCodigoBarras() {
        return codigoBarras;
    }

    public String getNombre() {
        return nombre;
    }

    public Long getCategoriaId() {
        return categoriaId;
    }

    public String getCategoriaNombre() {
        return categoriaNombre;
    }

    public BigDecimal getPrecioCosto() {
        return precioCosto;
    }

    public BigDecimal getPrecioVenta() {
        return precioVenta;
    }

    public BigDecimal getTarifaIva() {
        return tarifaIva;
    }

    public String getCodigoCabys() {
        return codigoCabys;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public BigDecimal getExistencia() {
        return existencia;
    }

    public BigDecimal getExistenciaMinima() {
        return existenciaMinima;
    }

    public boolean isAccesoRapido() {
        return accesoRapido;
    }

    public boolean isActivo() {
        return activo;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public Instant getActualizadoEn() {
        return actualizadoEn;
    }

    public static class Builder {
        private Long id;
        private String codigoBarras;
        private String nombre;
        private Long categoriaId;
        private String categoriaNombre;
        private BigDecimal precioCosto;
        private BigDecimal precioVenta;
        private BigDecimal tarifaIva;
        private String codigoCabys;
        private String unidadMedida;
        private BigDecimal existencia;
        private BigDecimal existenciaMinima;
        private boolean accesoRapido;
        private boolean activo;
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

        public Builder categoriaId(Long categoriaId) {
            this.categoriaId = categoriaId;
            return this;
        }

        public Builder categoriaNombre(String categoriaNombre) {
            this.categoriaNombre = categoriaNombre;
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

        public ProductoResponse build() {
            return new ProductoResponse(id, codigoBarras, nombre, categoriaId, categoriaNombre, precioCosto,
                    precioVenta, tarifaIva, codigoCabys, unidadMedida, existencia, existenciaMinima, accesoRapido,
                    activo, creadoEn, actualizadoEn);
        }
    }
}
