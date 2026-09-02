package com.crmsuper.pos.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardSummaryResponse {
    private final TotalCantidadRow ventasHoy;
    private final TotalCantidadRow ventasMes;
    private final long productosStockBajo;
    private final BigDecimal fiadoPendienteTotal;
    private final List<ProductoTopRow> productosTopHoy;

    public DashboardSummaryResponse(TotalCantidadRow ventasHoy, TotalCantidadRow ventasMes, long productosStockBajo,
                                     BigDecimal fiadoPendienteTotal, List<ProductoTopRow> productosTopHoy) {
        this.ventasHoy = ventasHoy;
        this.ventasMes = ventasMes;
        this.productosStockBajo = productosStockBajo;
        this.fiadoPendienteTotal = fiadoPendienteTotal;
        this.productosTopHoy = productosTopHoy;
    }

    public static Builder builder() {
        return new Builder();
    }

    public TotalCantidadRow getVentasHoy() {
        return ventasHoy;
    }

    public TotalCantidadRow getVentasMes() {
        return ventasMes;
    }

    public long getProductosStockBajo() {
        return productosStockBajo;
    }

    public BigDecimal getFiadoPendienteTotal() {
        return fiadoPendienteTotal;
    }

    public List<ProductoTopRow> getProductosTopHoy() {
        return productosTopHoy;
    }

    public static class Builder {
        private TotalCantidadRow ventasHoy;
        private TotalCantidadRow ventasMes;
        private long productosStockBajo;
        private BigDecimal fiadoPendienteTotal;
        private List<ProductoTopRow> productosTopHoy;

        public Builder ventasHoy(TotalCantidadRow ventasHoy) {
            this.ventasHoy = ventasHoy;
            return this;
        }

        public Builder ventasMes(TotalCantidadRow ventasMes) {
            this.ventasMes = ventasMes;
            return this;
        }

        public Builder productosStockBajo(long productosStockBajo) {
            this.productosStockBajo = productosStockBajo;
            return this;
        }

        public Builder fiadoPendienteTotal(BigDecimal fiadoPendienteTotal) {
            this.fiadoPendienteTotal = fiadoPendienteTotal;
            return this;
        }

        public Builder productosTopHoy(List<ProductoTopRow> productosTopHoy) {
            this.productosTopHoy = productosTopHoy;
            return this;
        }

        public DashboardSummaryResponse build() {
            return new DashboardSummaryResponse(ventasHoy, ventasMes, productosStockBajo, fiadoPendienteTotal,
                    productosTopHoy);
        }
    }
}
