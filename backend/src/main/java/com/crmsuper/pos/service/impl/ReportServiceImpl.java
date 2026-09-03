package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.*;
import com.crmsuper.pos.service.ReportService;
import com.crmsuper.pos.util.CrDateUtils;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Reportes y dashboard. Equivalente a backend/src/routes/reports.js.
 *
 * <p>Las fechas se guardan en UTC (columna creado_en tipo TIMESTAMP), pero el
 * negocio opera en hora de Costa Rica (UTC-6, sin horario de verano). Todas
 * las consultas que agrupan o filtran por "día" restan 6 horas a creado_en
 * con {@code DATE_SUB(..., INTERVAL 6 HOUR)} antes de extraer la fecha, para
 * que "hoy" y los rangos de fecha coincidan con el reloj de Costa Rica y no
 * con UTC (si no, el dashboard de "ventas de hoy" se vaciaría cada tarde a
 * partir de las 6pm hora CR).</p>
 */
@Service
public class ReportServiceImpl implements ReportService {

    private static final DateTimeFormatter YYYY_MM_DD = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter YYYY_MM = DateTimeFormatter.ofPattern("yyyy-MM");

    private final NamedParameterJdbcTemplate jdbc;

    public ReportServiceImpl(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary() {
        LocalDate hoy = CrDateUtils.hoy();
        MapSqlParameterSource hoyParams = new MapSqlParameterSource("hoy", hoy.format(YYYY_MM_DD));
        MapSqlParameterSource mesParams = new MapSqlParameterSource("mes", hoy.format(YYYY_MM));

        TotalCantidadRow ventasHoy = jdbc.queryForObject("""
                SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS cantidad
                FROM ventas WHERE estado = 'completada' AND DATE(DATE_SUB(creado_en, INTERVAL 6 HOUR)) = :hoy
                """, hoyParams, this::mapTotalCantidad);

        TotalCantidadRow ventasMes = jdbc.queryForObject("""
                SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS cantidad
                FROM ventas WHERE estado = 'completada'
                  AND DATE_FORMAT(DATE_SUB(creado_en, INTERVAL 6 HOUR), '%Y-%m') = :mes
                """, mesParams, this::mapTotalCantidad);

        long productosStockBajo = jdbc.queryForObject(
                "SELECT COUNT(*) FROM productos WHERE activo = 1 AND existencia <= existencia_minima",
                new MapSqlParameterSource(), Long.class);

        BigDecimal fiadoPendienteTotal = jdbc.queryForObject(
                "SELECT COALESCE(SUM(saldo_credito), 0) FROM clientes", new MapSqlParameterSource(), BigDecimal.class);

        List<ProductoTopRow> productosTopHoy = jdbc.query("""
                SELECT dv.producto_nombre, SUM(dv.cantidad) AS cantidad, SUM(dv.total) AS ingreso
                FROM detalle_ventas dv JOIN ventas v ON v.id = dv.venta_id
                WHERE v.estado = 'completada' AND DATE(DATE_SUB(v.creado_en, INTERVAL 6 HOUR)) = :hoy
                GROUP BY dv.producto_id, dv.producto_nombre ORDER BY ingreso DESC LIMIT 5
                """, hoyParams, (rs, n) -> ProductoTopRow.builder()
                .productoNombre(rs.getString("producto_nombre"))
                .cantidad(rs.getBigDecimal("cantidad"))
                .ingreso(rs.getBigDecimal("ingreso"))
                .build());

        return DashboardSummaryResponse.builder()
                .ventasHoy(ventasHoy)
                .ventasMes(ventasMes)
                .productosStockBajo(productosStockBajo)
                .fiadoPendienteTotal(fiadoPendienteTotal)
                .productosTopHoy(productosTopHoy)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesByDayRow> salesByDay(String from, String to) {
        StringBuilder sql = new StringBuilder("""
                SELECT DATE(DATE_SUB(creado_en, INTERVAL 6 HOUR)) AS dia, SUM(total) AS total, COUNT(*) AS cantidad
                FROM ventas WHERE estado = 'completada'
                """);
        MapSqlParameterSource params = withRango(sql, from, to, "creado_en");
        sql.append(" GROUP BY dia ORDER BY dia");
        return jdbc.query(sql.toString(), params, (rs, n) -> SalesByDayRow.builder()
                .dia(rs.getString("dia"))
                .total(rs.getBigDecimal("total"))
                .cantidad(rs.getLong("cantidad"))
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesByProductRow> salesByProduct(String from, String to, Integer limit) {
        StringBuilder sql = new StringBuilder("""
                SELECT dv.producto_nombre, SUM(dv.cantidad) AS cantidad, SUM(dv.total) AS ingreso
                FROM detalle_ventas dv JOIN ventas v ON v.id = dv.venta_id
                WHERE v.estado = 'completada'
                """);
        MapSqlParameterSource params = withRango(sql, from, to, "v.creado_en");
        sql.append(" GROUP BY dv.producto_id, dv.producto_nombre ORDER BY ingreso DESC LIMIT :limit");
        params.addValue("limit", limit != null ? limit : 10);
        return jdbc.query(sql.toString(), params, (rs, n) -> SalesByProductRow.builder()
                .productoNombre(rs.getString("producto_nombre"))
                .cantidad(rs.getBigDecimal("cantidad"))
                .ingreso(rs.getBigDecimal("ingreso"))
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesByCategoryRow> salesByCategory(String from, String to) {
        StringBuilder sql = new StringBuilder("""
                SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria, SUM(dv.total) AS ingreso, SUM(dv.cantidad) AS cantidad
                FROM detalle_ventas dv
                JOIN ventas v ON v.id = dv.venta_id
                JOIN productos p ON p.id = dv.producto_id
                LEFT JOIN categorias c ON c.id = p.categoria_id
                WHERE v.estado = 'completada'
                """);
        MapSqlParameterSource params = withRango(sql, from, to, "v.creado_en");
        sql.append(" GROUP BY categoria ORDER BY ingreso DESC");
        return jdbc.query(sql.toString(), params, (rs, n) -> SalesByCategoryRow.builder()
                .categoria(rs.getString("categoria"))
                .ingreso(rs.getBigDecimal("ingreso"))
                .cantidad(rs.getBigDecimal("cantidad"))
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesByCashierRow> salesByCashier(String from, String to) {
        StringBuilder sql = new StringBuilder("""
                SELECT u.nombre_completo AS cajero_nombre, SUM(v.total) AS ingreso, COUNT(*) AS cantidad
                FROM ventas v JOIN usuarios u ON u.id = v.usuario_id
                WHERE v.estado = 'completada'
                """);
        MapSqlParameterSource params = withRango(sql, from, to, "v.creado_en");
        sql.append(" GROUP BY v.usuario_id, u.nombre_completo ORDER BY ingreso DESC");
        return jdbc.query(sql.toString(), params, (rs, n) -> SalesByCashierRow.builder()
                .cajeroNombre(rs.getString("cajero_nombre"))
                .ingreso(rs.getBigDecimal("ingreso"))
                .cantidad(rs.getLong("cantidad"))
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProfitRow> profit(String from, String to) {
        StringBuilder sql = new StringBuilder("""
                SELECT dv.producto_nombre,
                       SUM(dv.cantidad) AS cantidad,
                       SUM(dv.subtotal) AS ingreso_sin_iva,
                       SUM(dv.cantidad * p.precio_costo) AS costo,
                       SUM(dv.subtotal) - SUM(dv.cantidad * p.precio_costo) AS ganancia
                FROM detalle_ventas dv
                JOIN ventas v ON v.id = dv.venta_id
                JOIN productos p ON p.id = dv.producto_id
                WHERE v.estado = 'completada'
                """);
        MapSqlParameterSource params = withRango(sql, from, to, "v.creado_en");
        sql.append(" GROUP BY dv.producto_id, dv.producto_nombre ORDER BY ganancia DESC");
        return jdbc.query(sql.toString(), params, (rs, n) -> ProfitRow.builder()
                .productoNombre(rs.getString("producto_nombre"))
                .cantidad(rs.getBigDecimal("cantidad"))
                .ingresoSinIva(rs.getBigDecimal("ingreso_sin_iva"))
                .costo(rs.getBigDecimal("costo"))
                .ganancia(rs.getBigDecimal("ganancia"))
                .build());
    }

    private MapSqlParameterSource withRango(StringBuilder sql, String from, String to, String columna) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (from != null && !from.isBlank()) {
            sql.append(" AND DATE_SUB(").append(columna).append(", INTERVAL 6 HOUR) >= :from");
            params.addValue("from", from);
        }
        if (to != null && !to.isBlank()) {
            sql.append(" AND DATE_SUB(").append(columna).append(", INTERVAL 6 HOUR) <= :to");
            params.addValue("to", to);
        }
        return params;
    }

    private TotalCantidadRow mapTotalCantidad(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return TotalCantidadRow.builder()
                .total(rs.getBigDecimal("total"))
                .cantidad(rs.getLong("cantidad"))
                .build();
    }
}
