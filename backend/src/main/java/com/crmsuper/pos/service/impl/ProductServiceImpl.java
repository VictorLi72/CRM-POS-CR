package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.CategoriaRequest;
import com.crmsuper.pos.dto.MovimientoResponse;
import com.crmsuper.pos.dto.ProductoRequest;
import com.crmsuper.pos.dto.ProductoResponse;
import com.crmsuper.pos.dto.StockAdjustRequest;
import com.crmsuper.pos.exception.ApiException;
import com.crmsuper.pos.model.Categoria;
import com.crmsuper.pos.model.MovimientoInventario;
import com.crmsuper.pos.model.Producto;
import com.crmsuper.pos.model.Promocion;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.model.enums.TipoMovimiento;
import com.crmsuper.pos.model.enums.TipoPromocion;
import com.crmsuper.pos.repository.CategoriaRepository;
import com.crmsuper.pos.repository.MovimientoInventarioRepository;
import com.crmsuper.pos.repository.ProductoRepository;
import com.crmsuper.pos.repository.UsuarioRepository;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.AuditoriaService;
import com.crmsuper.pos.service.ProductService;
import com.crmsuper.pos.service.PromocionService;
import com.crmsuper.pos.util.CrDateUtils;
import com.crmsuper.pos.util.PromocionUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final MovimientoInventarioRepository movimientoInventarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final PromocionService promocionService;
    private final NamedParameterJdbcTemplate jdbc;

    public ProductServiceImpl(
            ProductoRepository productoRepository,
            CategoriaRepository categoriaRepository,
            MovimientoInventarioRepository movimientoInventarioRepository,
            UsuarioRepository usuarioRepository,
            AuditoriaService auditoriaService,
            PromocionService promocionService,
            NamedParameterJdbcTemplate jdbc
    ) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
        this.movimientoInventarioRepository = movimientoInventarioRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaService = auditoriaService;
        this.promocionService = promocionService;
        this.jdbc = jdbc;
    }

    // --- Categorías ---

    @Override
    @Transactional(readOnly = true)
    public List<Categoria> listarCategorias() {
        return categoriaRepository.findAllByOrderByNombreAsc();
    }

    @Override
    @Transactional
    public Categoria crearCategoria(CategoriaRequest request, AuthenticatedUser usuario) {
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw ApiException.badRequest("El nombre es requerido");
        }
        if (categoriaRepository.existsByNombre(request.getNombre().trim())) {
            throw ApiException.badRequest("Ya existe una categoría con ese nombre");
        }
        Categoria categoria = categoriaRepository.save(Categoria.builder().nombre(request.getNombre().trim()).build());

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.CREAR, "Categoria",
                categoria.getId(), "Categoría creada: " + categoria.getNombre());

        return categoria;
    }

    @Override
    @Transactional
    public void eliminarCategoria(Long id, AuthenticatedUser usuario) {
        // Replica el ON DELETE SET NULL que tenía la columna categoria_id en SQLite:
        // los productos de esta categoría quedan sin categoría en vez de bloquear el borrado.
        jdbc.update("UPDATE productos SET categoria_id = NULL WHERE categoria_id = :id", new MapSqlParameterSource("id", id));
        categoriaRepository.deleteById(id);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ELIMINAR, "Categoria", id,
                "Categoría eliminada");
    }

    // --- Productos ---

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponse> listar(String search, Boolean lowStock, Long categoryId, Boolean quickAccess, BigDecimal tarifaIva) {
        StringBuilder sql = new StringBuilder("""
                SELECT p.*, c.nombre AS categoria_nombre, promo.tipo AS promo_tipo, promo.valor AS promo_valor
                FROM productos p
                LEFT JOIN categorias c ON c.id = p.categoria_id
                LEFT JOIN promociones promo ON promo.id = (
                    SELECT pr.id FROM promociones pr
                    WHERE pr.producto_id = p.id AND pr.activo = 1
                      AND pr.fecha_inicio <= :hoy AND pr.fecha_fin >= :hoy
                    ORDER BY pr.id DESC LIMIT 1
                )
                WHERE p.activo = 1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource("hoy", CrDateUtils.hoy());
        if (search != null && !search.isBlank()) {
            sql.append(" AND (p.nombre LIKE :search OR p.codigo_barras LIKE :search)");
            params.addValue("search", "%" + search + "%");
        }
        if (categoryId != null) {
            sql.append(" AND p.categoria_id = :categoryId");
            params.addValue("categoryId", categoryId);
        }
        if (tarifaIva != null) {
            sql.append(" AND p.tarifa_iva = :tarifaIva");
            params.addValue("tarifaIva", tarifaIva);
        }
        if (Boolean.TRUE.equals(lowStock)) {
            sql.append(" AND p.existencia <= p.existencia_minima");
        }
        if (Boolean.TRUE.equals(quickAccess)) {
            sql.append(" AND p.acceso_rapido = 1");
        }
        sql.append(" ORDER BY p.nombre");

        return jdbc.query(sql.toString(), params, (rs, rowNum) -> {
            BigDecimal precioVenta = rs.getBigDecimal("precio_venta");
            String promoTipo = rs.getString("promo_tipo");
            BigDecimal precioEfectivo = precioVenta;
            BigDecimal precioOriginal = null;
            if (promoTipo != null) {
                precioEfectivo = PromocionUtils.precioEfectivo(
                        precioVenta, TipoPromocion.valueOf(promoTipo), rs.getBigDecimal("promo_valor"));
                precioOriginal = precioVenta;
            }
            return ProductoResponse.builder()
                    .id(rs.getLong("id"))
                    .codigoBarras(rs.getString("codigo_barras"))
                    .nombre(rs.getString("nombre"))
                    .categoriaId(rs.getObject("categoria_id") != null ? rs.getLong("categoria_id") : null)
                    .categoriaNombre(rs.getString("categoria_nombre"))
                    .precioCosto(rs.getBigDecimal("precio_costo"))
                    .precioVenta(precioVenta)
                    .precioEfectivo(precioEfectivo)
                    .precioVentaOriginal(precioOriginal)
                    .tarifaIva(rs.getBigDecimal("tarifa_iva"))
                    .codigoCabys(rs.getString("codigo_cabys"))
                    .unidadMedida(rs.getString("unidad_medida"))
                    .existencia(rs.getBigDecimal("existencia"))
                    .existenciaMinima(rs.getBigDecimal("existencia_minima"))
                    .accesoRapido(rs.getBoolean("acceso_rapido"))
                    .activo(rs.getBoolean("activo"))
                    .creadoEn(rs.getTimestamp("creado_en").toInstant())
                    .actualizadoEn(rs.getTimestamp("actualizado_en").toInstant())
                    .build();
        });
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorBarcode(String barcode) {
        Producto producto = productoRepository.findByCodigoBarrasAndActivoTrue(barcode)
                .orElseThrow(() -> ApiException.notFound("Producto no encontrado"));
        return toResponse(producto);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponse obtenerPorId(Long id) {
        return toResponse(buscar(id));
    }

    @Override
    @Transactional
    public ProductoResponse crear(ProductoRequest request, AuthenticatedUser usuario) {
        if (request.getPrecioVenta() == null) {
            throw ApiException.badRequest("El precio de venta es requerido");
        }
        String codigoBarras = blankToNull(request.getCodigoBarras());
        // El nombre es opcional al crear (se prioriza escanear el código de
        // barras primero): si no lo escriben, se usa el código de barras como
        // nombre temporal, editable después desde "Editar producto".
        String nombre = (request.getNombre() != null && !request.getNombre().isBlank())
                ? request.getNombre().trim()
                : codigoBarras;
        if (nombre == null) {
            throw ApiException.badRequest("Se requiere un código de barras o un nombre");
        }
        if (codigoBarras != null && productoRepository.existsByCodigoBarras(codigoBarras)) {
            throw ApiException.badRequest("No se pudo crear el producto (código de barras duplicado?)");
        }
        Producto producto = Producto.builder()
                .codigoBarras(codigoBarras)
                .nombre(nombre)
                .categoria(request.getCategoriaId() != null ? categoriaRepository.getReferenceById(request.getCategoriaId()) : null)
                .precioCosto(request.getPrecioCosto() != null ? request.getPrecioCosto() : BigDecimal.ZERO)
                .precioVenta(request.getPrecioVenta())
                .tarifaIva(request.getTarifaIva() != null ? request.getTarifaIva() : BigDecimal.valueOf(13))
                .codigoCabys(blankToNull(request.getCodigoCabys()))
                .unidadMedida(request.getUnidadMedida() != null ? request.getUnidadMedida() : "unidad")
                .existencia(request.getExistencia() != null ? request.getExistencia() : BigDecimal.ZERO)
                .existenciaMinima(request.getExistenciaMinima() != null ? request.getExistenciaMinima() : BigDecimal.valueOf(5))
                .accesoRapido(Boolean.TRUE.equals(request.getAccesoRapido()))
                .activo(true)
                .build();
        producto = productoRepository.save(producto);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.CREAR, "Producto",
                producto.getId(), "Producto creado: " + producto.getNombre() + ", precio ₡" + producto.getPrecioVenta());

        return toResponse(producto);
    }

    @Override
    @Transactional
    public ProductoResponse actualizar(Long id, ProductoRequest request, AuthenticatedUser usuario) {
        Producto existente = buscar(id);
        BigDecimal precioAnterior = existente.getPrecioVenta();
        if (request.getCodigoBarras() != null) existente.setCodigoBarras(blankToNull(request.getCodigoBarras()));
        if (request.getNombre() != null) existente.setNombre(request.getNombre());
        if (request.getCategoriaId() != null) existente.setCategoria(categoriaRepository.getReferenceById(request.getCategoriaId()));
        if (request.getPrecioCosto() != null) existente.setPrecioCosto(request.getPrecioCosto());
        if (request.getPrecioVenta() != null) existente.setPrecioVenta(request.getPrecioVenta());
        if (request.getTarifaIva() != null) existente.setTarifaIva(request.getTarifaIva());
        if (request.getCodigoCabys() != null) existente.setCodigoCabys(blankToNull(request.getCodigoCabys()));
        if (request.getUnidadMedida() != null) existente.setUnidadMedida(request.getUnidadMedida());
        if (request.getExistenciaMinima() != null) existente.setExistenciaMinima(request.getExistenciaMinima());
        if (request.getAccesoRapido() != null) existente.setAccesoRapido(request.getAccesoRapido());
        existente = productoRepository.save(existente);

        String detalle = "Producto actualizado: " + existente.getNombre();
        if (request.getPrecioVenta() != null && precioAnterior.compareTo(existente.getPrecioVenta()) != 0) {
            detalle += " (precio ₡" + precioAnterior + " → ₡" + existente.getPrecioVenta() + ")";
        }
        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ACTUALIZAR, "Producto",
                existente.getId(), detalle);

        return toResponse(existente);
    }

    @Override
    @Transactional
    public void eliminar(Long id, AuthenticatedUser usuario) {
        Producto producto = buscar(id);
        producto.setActivo(false);
        productoRepository.save(producto);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ELIMINAR, "Producto", id,
                "Producto desactivado: " + producto.getNombre());
    }

    @Override
    @Transactional
    public ProductoResponse ajustarStock(Long id, StockAdjustRequest request, AuthenticatedUser usuario) {
        if (request.getTipo() == null
                || !List.of(TipoMovimiento.entrada, TipoMovimiento.salida, TipoMovimiento.ajuste).contains(request.getTipo())
                || request.getCantidad() == null) {
            throw ApiException.badRequest("Tipo y cantidad son requeridos");
        }
        Producto producto = buscar(id);

        BigDecimal delta = request.getTipo() == TipoMovimiento.salida
                ? request.getCantidad().abs().negate()
                : request.getCantidad().abs();
        BigDecimal nuevaExistencia = request.getTipo() == TipoMovimiento.ajuste
                ? request.getCantidad()
                : producto.getExistencia().add(delta);
        BigDecimal cantidadMovimiento = request.getTipo() == TipoMovimiento.ajuste
                ? nuevaExistencia.subtract(producto.getExistencia())
                : delta;

        producto.setExistencia(nuevaExistencia);
        productoRepository.save(producto);

        movimientoInventarioRepository.save(MovimientoInventario.builder()
                .producto(producto)
                .tipo(request.getTipo())
                .cantidad(cantidadMovimiento)
                .referencia(request.getReferencia())
                .usuario(usuarioRepository.getReferenceById(usuario.id()))
                .build());

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.AJUSTAR_STOCK, "Producto",
                producto.getId(), "Ajuste (" + request.getTipo() + ") de " + producto.getNombre()
                        + ", cantidad " + cantidadMovimiento + ", nueva existencia " + nuevaExistencia);

        return toResponse(producto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovimientoResponse> movimientos(Long productoId) {
        return movimientoInventarioRepository.findByProductoIdOrderByCreadoEnDesc(productoId, PageRequest.of(0, 100))
                .stream()
                .map(m -> MovimientoResponse.builder()
                        .id(m.getId())
                        .productoId(m.getProducto().getId())
                        .tipo(m.getTipo())
                        .cantidad(m.getCantidad())
                        .referencia(m.getReferencia())
                        .usuarioId(m.getUsuario() != null ? m.getUsuario().getId() : null)
                        .usuarioNombre(m.getUsuario() != null ? m.getUsuario().getNombreCompleto() : null)
                        .creadoEn(m.getCreadoEn())
                        .build())
                .toList();
    }

    private Producto buscar(Long id) {
        return productoRepository.findById(id).orElseThrow(() -> ApiException.notFound("Producto no encontrado"));
    }

    private ProductoResponse toResponse(Producto p) {
        Categoria categoria = p.getCategoria();
        Optional<Promocion> promo = promocionService.promoVigentePara(p.getId());
        BigDecimal precioEfectivo = promo.map(pr -> PromocionUtils.precioEfectivo(p.getPrecioVenta(), pr))
                .orElse(p.getPrecioVenta());
        BigDecimal precioOriginal = promo.isPresent() ? p.getPrecioVenta() : null;
        return ProductoResponse.builder()
                .id(p.getId())
                .codigoBarras(p.getCodigoBarras())
                .nombre(p.getNombre())
                .categoriaId(categoria != null ? categoria.getId() : null)
                .categoriaNombre(categoria != null ? categoria.getNombre() : null)
                .precioCosto(p.getPrecioCosto())
                .precioVenta(p.getPrecioVenta())
                .precioEfectivo(precioEfectivo)
                .precioVentaOriginal(precioOriginal)
                .tarifaIva(p.getTarifaIva())
                .codigoCabys(p.getCodigoCabys())
                .unidadMedida(p.getUnidadMedida())
                .existencia(p.getExistencia())
                .existenciaMinima(p.getExistenciaMinima())
                .accesoRapido(p.isAccesoRapido())
                .activo(p.isActivo())
                .creadoEn(p.getCreadoEn())
                .actualizadoEn(p.getActualizadoEn())
                .build();
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
