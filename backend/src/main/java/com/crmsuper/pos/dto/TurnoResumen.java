package com.crmsuper.pos.dto;

import java.math.BigDecimal;
import java.util.List;

public class TurnoResumen {
    private final BigDecimal ventasEfectivo;
    private final long ventasEfectivoCantidad;
    private final List<VentasPorMetodoRow> ventasPorMetodo;
    private final BigDecimal abonosFiado;
    private final BigDecimal devolucionesEfectivo;

    public TurnoResumen(BigDecimal ventasEfectivo, long ventasEfectivoCantidad,
                         List<VentasPorMetodoRow> ventasPorMetodo, BigDecimal abonosFiado,
                         BigDecimal devolucionesEfectivo) {
        this.ventasEfectivo = ventasEfectivo;
        this.ventasEfectivoCantidad = ventasEfectivoCantidad;
        this.ventasPorMetodo = ventasPorMetodo;
        this.abonosFiado = abonosFiado;
        this.devolucionesEfectivo = devolucionesEfectivo;
    }

    public static Builder builder() {
        return new Builder();
    }

    public BigDecimal getVentasEfectivo() {
        return ventasEfectivo;
    }

    public long getVentasEfectivoCantidad() {
        return ventasEfectivoCantidad;
    }

    public List<VentasPorMetodoRow> getVentasPorMetodo() {
        return ventasPorMetodo;
    }

    public BigDecimal getAbonosFiado() {
        return abonosFiado;
    }

    public BigDecimal getDevolucionesEfectivo() {
        return devolucionesEfectivo;
    }

    public static class Builder {
        private BigDecimal ventasEfectivo;
        private long ventasEfectivoCantidad;
        private List<VentasPorMetodoRow> ventasPorMetodo;
        private BigDecimal abonosFiado;
        private BigDecimal devolucionesEfectivo;

        public Builder ventasEfectivo(BigDecimal ventasEfectivo) {
            this.ventasEfectivo = ventasEfectivo;
            return this;
        }

        public Builder ventasEfectivoCantidad(long ventasEfectivoCantidad) {
            this.ventasEfectivoCantidad = ventasEfectivoCantidad;
            return this;
        }

        public Builder ventasPorMetodo(List<VentasPorMetodoRow> ventasPorMetodo) {
            this.ventasPorMetodo = ventasPorMetodo;
            return this;
        }

        public Builder abonosFiado(BigDecimal abonosFiado) {
            this.abonosFiado = abonosFiado;
            return this;
        }

        public Builder devolucionesEfectivo(BigDecimal devolucionesEfectivo) {
            this.devolucionesEfectivo = devolucionesEfectivo;
            return this;
        }

        public TurnoResumen build() {
            return new TurnoResumen(ventasEfectivo, ventasEfectivoCantidad, ventasPorMetodo, abonosFiado,
                    devolucionesEfectivo);
        }
    }
}
