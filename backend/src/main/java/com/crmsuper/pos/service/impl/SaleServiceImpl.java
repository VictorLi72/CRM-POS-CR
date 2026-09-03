package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.*;
import com.crmsuper.pos.exception.ApiException;
import com.crmsuper.pos.model.*;
import com.crmsuper.pos.model.enums.EstadoVenta;
import com.crmsuper.pos.model.enums.MetodoPago;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.model.enums.TipoMovimiento;
import com.crmsuper.pos.repository.*;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.AuditoriaService;
import com.crmsuper.pos.service.PromocionService;
import com.crmsuper.pos.service.SaleService;
import com.crmsuper.pos.util.MoneyUtils;
import com.crmsuper.pos.util.PromocionUtils;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lógica de negocio del POS: checkout de ventas, anulación y devoluciones.
 * Equivalente a backend/src/routes/sales.js del backend anterior.
 */
@Service
public class SaleServiceImpl implements SaleService {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoInventarioRepository movimientoInventarioRepository;
    private final DevolucionRepository devolucionRepository;
    private final DevolucionItemRepository devolucionItemRepository;
    private final FolioCounterRepository folioCounterRepository;
    private final AuditoriaService auditoriaService;
    private final PromocionService promocionService;
    private final NamedParameterJdbcTemplate jdbc;

    public SaleServiceImpl(
            VentaRepository ventaRepository,
            DetalleVentaRepository detalleVentaRepository,
            ProductoRepository productoRepository,
            ClienteRepository clienteRepository,
            UsuarioRepository usuarioRepository,
            MovimientoInventarioRepository movimientoInventarioRepository,
            DevolucionRepository devolucionRepository,
            DevolucionItemRepository devolucionItemRepository,
            FolioCounterRepository folioCounterRepository,
            AuditoriaService auditoriaService,
            PromocionService promocionService,
            NamedParameterJdbcTemplate jdbc
    ) {
        this.ventaRepository = ventaRepository;
        this.detalleVentaRepository = detalleVentaRepository;
        this.productoRepository = productoRepository;
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.movimientoInventarioRepository = movimientoInventarioRepository;
        this.devolucionRepository = devolucionRepository;
        this.devolucionItemRepository = devolucionItemRepository;
        this.folioCounterRepository = folioCounterRepository;
        this.auditoriaService = auditoriaService;
        this.promocionService = promocionService;
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public VentaResponse crear(SaleRequest request, AuthenticatedUser usuario) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw ApiException.badRequest("La venta debe tener al menos un producto");
        }
        if (request.getMetodoPago() == null) {
            throw ApiException.badRequest("Método de pago inválido");
        }
        if (request.getMetodoPago() == MetodoPago.fiado && request.getClienteId() == null) {
            throw ApiException.badRequest("Una venta fiada requiere seleccionar un cliente");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal ivaTotal = BigDecimal.ZERO;
        List<ItemPreparado> preparados = new ArrayList<>();

        for (SaleItemRequest it : request.getItems()) {
            Producto producto = productoRepository.findById(it.getProductoId())
                    .orElseThrow(() -> ApiException.badRequest("Producto " + it.getProductoId() + " no encontrado"));
            if (producto.getExistencia().compareTo(it.getCantidad()) < 0) {
                throw ApiException.badRequest(
                        "Stock insuficiente para \"" + producto.getNombre() + "\" (disponible: " + producto.getExistencia() + ")");
            }
            // Si el frontend no manda un precio explícito, se usa el precio
            // efectivo (con la promoción vigente aplicada, si el producto
            // tiene una) en vez del precio de catálogo a secas.
            BigDecimal precioUnitario = it.getPrecioUnitario() != null
                    ? it.getPrecioUnitario()
                    : promocionService.promoVigentePara(producto.getId())
                            .map(promo -> PromocionUtils.precioEfectivo(producto.getPrecioVenta(), promo))
                            .orElse(producto.getPrecioVenta());
            BigDecimal descuentoLinea = it.getDescuento() != null ? it.getDescuento() : BigDecimal.ZERO;
            BigDecimal baseLinea = precioUnitario.multiply(it.getCantidad()).subtract(descuentoLinea);
            // El precio de venta ya incluye el IVA (práctica común en tiquetes de súper en CR).
            BigDecimal tarifaIva = producto.getTarifaIva();
            BigDecimal divisor = BigDecimal.ONE.add(tarifaIva.divide(CIEN, 10, RoundingMode.HALF_UP));
            BigDecimal baseLineaSinIva = baseLinea.divide(divisor, 10, RoundingMode.HALF_UP);
            BigDecimal ivaLinea = baseLinea.subtract(baseLineaSinIva);

            subtotal = subtotal.add(baseLineaSinIva);
            ivaTotal = ivaTotal.add(ivaLinea);

            preparados.add(new ItemPreparado(
                    producto, it.getCantidad(), precioUnitario, tarifaIva, descuentoLinea,
                    MoneyUtils.round2(baseLineaSinIva), MoneyUtils.round2(ivaLinea), MoneyUtils.round2(baseLinea)));
        }

        subtotal = MoneyUtils.round2(subtotal);
        ivaTotal = MoneyUtils.round2(ivaTotal);
        BigDecimal descuentoTotal = MoneyUtils.round2(request.getDescuentoTotal() != null ? request.getDescuentoTotal() : BigDecimal.ZERO);
        BigDecimal total = MoneyUtils.round2(subtotal.add(ivaTotal).subtract(descuentoTotal));

        Cliente cliente = null;
        if (request.getMetodoPago() == MetodoPago.fiado) {
            cliente = clienteRepository.findById(request.getClienteId())
                    .orElseThrow(() -> ApiException.badRequest("Cliente no encontrado"));
            BigDecimal nuevoSaldo = cliente.getSaldoCredito().add(total);
            if (cliente.getLimiteCredito().signum() > 0 && nuevoSaldo.compareTo(cliente.getLimiteCredito()) > 0) {
                throw ApiException.badRequest("La venta supera el límite de crédito del cliente");
            }
        } else if (request.getClienteId() != null) {
            cliente = clienteRepository.findById(request.getClienteId()).orElse(null);
        }

        Long folio = siguienteFolio();
        BigDecimal montoRecibido = request.getMontoRecibido() != null ? request.getMontoRecibido() : total;

        Venta venta = Venta.builder()
                .folio(folio)
                .usuario(usuarioRepository.getReferenceById(usuario.id()))
                .cliente(cliente)
                .subtotal(subtotal)
                .descuentoTotal(descuentoTotal)
                .ivaTotal(ivaTotal)
                .total(total)
                .metodoPago(request.getMetodoPago())
                .montoRecibido(request.getMetodoPago() == MetodoPago.efectivo ? montoRecibido : null)
                .vuelto(request.getMetodoPago() == MetodoPago.efectivo ? MoneyUtils.round2(montoRecibido.subtract(total)) : null)
                .estado(EstadoVenta.completada)
                .build();
        venta = ventaRepository.save(venta);

        List<DetalleVenta> detalles = new ArrayList<>();
        for (ItemPreparado pi : preparados) {
            DetalleVenta detalle = detalleVentaRepository.save(DetalleVenta.builder()
                    .venta(venta)
                    .producto(pi.producto())
                    .productoNombre(pi.producto().getNombre())
                    .cantidad(pi.cantidad())
                    .precioUnitario(pi.precioUnitario())
                    .tarifaIva(pi.tarifaIva())
                    .descuento(pi.descuento())
                    .subtotal(pi.subtotal())
                    .montoIva(pi.montoIva())
                    .total(pi.total())
                    .build());
            detalles.add(detalle);

            Producto producto = pi.producto();
            producto.setExistencia(producto.getExistencia().subtract(pi.cantidad()));
            productoRepository.save(producto);

            movimientoInventarioRepository.save(MovimientoInventario.builder()
                    .producto(producto)
                    .tipo(TipoMovimiento.venta)
                    .cantidad(pi.cantidad().negate())
                    .referencia("Venta #" + folio)
                    .usuario(usuarioRepository.getReferenceById(usuario.id()))
                    .build());
        }

        if (request.getMetodoPago() == MetodoPago.fiado) {
            cliente.setSaldoCredito(cliente.getSaldoCredito().add(total));
            clienteRepository.save(cliente);
        } else if (cliente != null) {
            long puntos = total.divide(BigDecimal.valueOf(1000), 0, RoundingMode.FLOOR).longValue();
            if (puntos > 0) {
                cliente.setPuntosLealtad(cliente.getPuntosLealtad() + (int) puntos);
                clienteRepository.save(cliente);
            }
        }

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.CREAR, "Venta", venta.getId(),
                "Folio #" + folio + ", total ₡" + total + ", método: " + request.getMetodoPago());

        return toResponse(venta, detalles, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VentaResponse> listar(String from, String to, Long userId, String status) {
        StringBuilder sql = new StringBuilder("""
                SELECT v.*, u.nombre_completo AS cajero_nombre, c.nombre AS cliente_nombre
                FROM ventas v
                LEFT JOIN usuarios u ON u.id = v.usuario_id
                LEFT JOIN clientes c ON c.id = v.cliente_id
                WHERE 1=1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (from != null && !from.isBlank()) {
            sql.append(" AND v.creado_en >= :from");
            params.addValue("from", from);
        }
        if (to != null && !to.isBlank()) {
            sql.append(" AND v.creado_en <= :to");
            params.addValue("to", to);
        }
        if (userId != null) {
            sql.append(" AND v.usuario_id = :userId");
            params.addValue("userId", userId);
        }
        if (status != null && !status.isBlank()) {
            sql.append(" AND v.estado = :status");
            params.addValue("status", status);
        }
        sql.append(" ORDER BY v.creado_en DESC LIMIT 500");
        return jdbc.query(sql.toString(), params, this::mapVentaRow);
    }

    @Override
    @Transactional(readOnly = true)
    public VentaResponse obtenerPorFolio(Long folio) {
        Venta venta = ventaRepository.findByFolio(folio)
                .orElseThrow(() -> ApiException.notFound("No existe una venta con ese folio"));
        List<DetalleVenta> items = detalleVentaRepository.findByVentaIdOrderById(venta.getId());
        Map<Long, BigDecimal> devueltoMap = new HashMap<>();
        for (DetalleVenta it : items) {
            BigDecimal devuelto = devolucionItemRepository.sumCantidadByDetalleVentaId(it.getId());
            devueltoMap.put(it.getId(), devuelto != null ? devuelto : BigDecimal.ZERO);
        }
        return toResponse(venta, items, devueltoMap);
    }

    @Override
    @Transactional(readOnly = true)
    public VentaResponse obtenerPorId(Long id) {
        Venta venta = ventaRepository.findById(id).orElseThrow(() -> ApiException.notFound("Venta no encontrada"));
        List<DetalleVenta> items = detalleVentaRepository.findByVentaIdOrderById(venta.getId());
        return toResponse(venta, items, null);
    }

    @Override
    @Transactional
    public VentaResponse anular(Long id, AuthenticatedUser usuario) {
        Venta venta = ventaRepository.findById(id).orElseThrow(() -> ApiException.notFound("Venta no encontrada"));
        if (venta.getEstado() == EstadoVenta.anulada) {
            throw ApiException.badRequest("La venta ya está anulada");
        }

        List<DetalleVenta> items = detalleVentaRepository.findByVentaIdOrderById(venta.getId());
        for (DetalleVenta it : items) {
            Producto producto = it.getProducto();
            producto.setExistencia(producto.getExistencia().add(it.getCantidad()));
            productoRepository.save(producto);

            movimientoInventarioRepository.save(MovimientoInventario.builder()
                    .producto(producto)
                    .tipo(TipoMovimiento.anulacion)
                    .cantidad(it.getCantidad())
                    .referencia("Anulación venta #" + venta.getFolio())
                    .usuario(usuarioRepository.getReferenceById(usuario.id()))
                    .build());
        }

        if (venta.getMetodoPago() == MetodoPago.fiado && venta.getCliente() != null) {
            Cliente cliente = venta.getCliente();
            cliente.setSaldoCredito(cliente.getSaldoCredito().subtract(venta.getTotal()));
            clienteRepository.save(cliente);
        }

        venta.setEstado(EstadoVenta.anulada);
        venta = ventaRepository.save(venta);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ANULAR, "Venta", venta.getId(),
                "Folio #" + venta.getFolio() + ", total ₡" + venta.getTotal());

        return toResponse(venta, null, null);
    }

    @Override
    @Transactional
    public DevolucionResponse devolucion(Long ventaId, DevolucionRequest request, AuthenticatedUser usuario) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw ApiException.badRequest("La devolución debe tener al menos un producto");
        }
        Venta venta = ventaRepository.findById(ventaId).orElseThrow(() -> ApiException.notFound("Venta no encontrada"));
        if (venta.getEstado() == EstadoVenta.anulada) {
            throw ApiException.badRequest("No se puede devolver una venta anulada");
        }

        BigDecimal total = BigDecimal.ZERO;
        List<DevolucionItemPreparado> preparados = new ArrayList<>();

        for (DevolucionItemRequest it : request.getItems()) {
            if (it.getCantidad() == null || it.getCantidad().signum() <= 0) continue;
            DetalleVenta detalle = detalleVentaRepository.findByIdAndVentaId(it.getDetalleVentaId(), venta.getId())
                    .orElseThrow(() -> ApiException.badRequest(
                            "El detalle " + it.getDetalleVentaId() + " no pertenece a esta venta"));

            BigDecimal yaDevuelto = devolucionItemRepository.sumCantidadByDetalleVentaId(detalle.getId());
            if (yaDevuelto == null) yaDevuelto = BigDecimal.ZERO;
            BigDecimal disponible = detalle.getCantidad().subtract(yaDevuelto);
            if (it.getCantidad().compareTo(disponible.add(new BigDecimal("0.000000001"))) > 0) {
                throw ApiException.badRequest(
                        "No se puede devolver " + it.getCantidad() + " de \"" + detalle.getProductoNombre()
                                + "\" (ya disponible para devolver: " + disponible + ")");
            }

            BigDecimal totalLinea = MoneyUtils.round2(
                    detalle.getTotal().divide(detalle.getCantidad(), 10, RoundingMode.HALF_UP).multiply(it.getCantidad()));
            total = total.add(totalLinea);
            preparados.add(new DevolucionItemPreparado(detalle, it.getCantidad(), totalLinea));
        }

        if (preparados.isEmpty()) {
            throw ApiException.badRequest("No hay cantidades válidas para devolver");
        }
        total = MoneyUtils.round2(total);

        Devolucion devolucion = devolucionRepository.save(Devolucion.builder()
                .venta(venta)
                .usuario(usuarioRepository.getReferenceById(usuario.id()))
                .motivo(request.getMotivo())
                .total(total)
                .build());

        List<DevolucionItem> items = new ArrayList<>();
        for (DevolucionItemPreparado pi : preparados) {
            DevolucionItem item = devolucionItemRepository.save(DevolucionItem.builder()
                    .devolucion(devolucion)
                    .detalleVenta(pi.detalle())
                    .producto(pi.detalle().getProducto())
                    .productoNombre(pi.detalle().getProductoNombre())
                    .cantidad(pi.cantidad())
                    .precioUnitario(pi.detalle().getPrecioUnitario())
                    .total(pi.total())
                    .build());
            items.add(item);

            Producto producto = pi.detalle().getProducto();
            producto.setExistencia(producto.getExistencia().add(pi.cantidad()));
            productoRepository.save(producto);

            movimientoInventarioRepository.save(MovimientoInventario.builder()
                    .producto(producto)
                    .tipo(TipoMovimiento.entrada)
                    .cantidad(pi.cantidad())
                    .referencia("Devolución venta #" + venta.getFolio())
                    .usuario(usuarioRepository.getReferenceById(usuario.id()))
                    .build());
        }

        if (venta.getMetodoPago() == MetodoPago.fiado && venta.getCliente() != null) {
            Cliente cliente = venta.getCliente();
            cliente.setSaldoCredito(cliente.getSaldoCredito().subtract(total));
            clienteRepository.save(cliente);
        }

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.DEVOLVER, "Venta",
                venta.getId(), "Devolución de folio #" + venta.getFolio() + ", total ₡" + total);

        return toDevolucionResponse(devolucion, items);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DevolucionResponse> devoluciones(Long ventaId) {
        return devolucionRepository.findByVentaIdOrderByCreadoEnDesc(ventaId).stream()
                .map(d -> toDevolucionResponse(d, devolucionItemRepository.findByDevolucionId(d.getId())))
                .toList();
    }

    private Long siguienteFolio() {
        FolioCounter counter = folioCounterRepository.findById(1L)
                .orElseGet(() -> folioCounterRepository.save(new FolioCounter(1L, 0L)));
        counter.setUltimoFolio(counter.getUltimoFolio() + 1);
        folioCounterRepository.save(counter);
        return counter.getUltimoFolio();
    }

    private VentaResponse mapVentaRow(ResultSet rs, int rowNum) throws SQLException {
        return VentaResponse.builder()
                .id(rs.getLong("id"))
                .folio(rs.getLong("folio"))
                .usuarioId(rs.getLong("usuario_id"))
                .cajeroNombre(rs.getString("cajero_nombre"))
                .clienteId(rs.getObject("cliente_id") != null ? rs.getLong("cliente_id") : null)
                .clienteNombre(rs.getString("cliente_nombre"))
                .subtotal(rs.getBigDecimal("subtotal"))
                .descuentoTotal(rs.getBigDecimal("descuento_total"))
                .ivaTotal(rs.getBigDecimal("iva_total"))
                .total(rs.getBigDecimal("total"))
                .metodoPago(MetodoPago.valueOf(rs.getString("metodo_pago")))
                .montoRecibido(rs.getBigDecimal("monto_recibido"))
                .vuelto(rs.getBigDecimal("vuelto"))
                .estado(EstadoVenta.valueOf(rs.getString("estado")))
                .creadoEn(rs.getTimestamp("creado_en").toInstant())
                .items(null)
                .build();
    }

    private VentaResponse toResponse(Venta v, List<DetalleVenta> items, Map<Long, BigDecimal> devueltoMap) {
        return VentaResponse.builder()
                .id(v.getId())
                .folio(v.getFolio())
                .usuarioId(v.getUsuario().getId())
                .cajeroNombre(v.getUsuario().getNombreCompleto())
                .clienteId(v.getCliente() != null ? v.getCliente().getId() : null)
                .clienteNombre(v.getCliente() != null ? v.getCliente().getNombre() : null)
                .subtotal(v.getSubtotal())
                .descuentoTotal(v.getDescuentoTotal())
                .ivaTotal(v.getIvaTotal())
                .total(v.getTotal())
                .metodoPago(v.getMetodoPago())
                .montoRecibido(v.getMontoRecibido())
                .vuelto(v.getVuelto())
                .estado(v.getEstado())
                .creadoEn(v.getCreadoEn())
                .items(items != null ? items.stream().map(d -> toDetalleResponse(d, devueltoMap)).toList() : null)
                .build();
    }

    private DetalleVentaResponse toDetalleResponse(DetalleVenta d, Map<Long, BigDecimal> devueltoMap) {
        return DetalleVentaResponse.builder()
                .id(d.getId())
                .productoId(d.getProducto().getId())
                .productoNombre(d.getProductoNombre())
                .cantidad(d.getCantidad())
                .precioUnitario(d.getPrecioUnitario())
                .tarifaIva(d.getTarifaIva())
                .descuento(d.getDescuento())
                .subtotal(d.getSubtotal())
                .montoIva(d.getMontoIva())
                .total(d.getTotal())
                .cantidadDevuelta(devueltoMap != null ? devueltoMap.get(d.getId()) : null)
                .build();
    }

    private DevolucionResponse toDevolucionResponse(Devolucion d, List<DevolucionItem> items) {
        return DevolucionResponse.builder()
                .id(d.getId())
                .ventaId(d.getVenta().getId())
                .usuarioId(d.getUsuario() != null ? d.getUsuario().getId() : null)
                .usuarioNombre(d.getUsuario() != null ? d.getUsuario().getNombreCompleto() : null)
                .motivo(d.getMotivo())
                .total(d.getTotal())
                .creadoEn(d.getCreadoEn())
                .items(items.stream().map(this::toDevolucionItemResponse).toList())
                .build();
    }

    private DevolucionItemResponse toDevolucionItemResponse(DevolucionItem i) {
        return DevolucionItemResponse.builder()
                .id(i.getId())
                .detalleVentaId(i.getDetalleVenta().getId())
                .productoId(i.getProducto().getId())
                .productoNombre(i.getProductoNombre())
                .cantidad(i.getCantidad())
                .precioUnitario(i.getPrecioUnitario())
                .total(i.getTotal())
                .build();
    }

    private record ItemPreparado(
            Producto producto, BigDecimal cantidad, BigDecimal precioUnitario, BigDecimal tarifaIva,
            BigDecimal descuento, BigDecimal subtotal, BigDecimal montoIva, BigDecimal total) {
    }

    private record DevolucionItemPreparado(DetalleVenta detalle, BigDecimal cantidad, BigDecimal total) {
    }
}
