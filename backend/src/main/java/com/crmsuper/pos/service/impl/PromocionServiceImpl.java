package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.PromocionRequest;
import com.crmsuper.pos.dto.PromocionResponse;
import com.crmsuper.pos.exception.ApiException;
import com.crmsuper.pos.model.Producto;
import com.crmsuper.pos.model.Promocion;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.model.enums.TipoPromocion;
import com.crmsuper.pos.repository.ProductoRepository;
import com.crmsuper.pos.repository.PromocionRepository;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.AuditoriaService;
import com.crmsuper.pos.service.PromocionService;
import com.crmsuper.pos.util.CrDateUtils;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Promociones sobre productos: rebajas (por % o precio fijo) con vigencia
 * por fechas, que se aplican solas en el POS. Equivalente de negocio a los
 * "descuentos" ya existentes, pero atadas a un producto específico y
 * aplicadas automáticamente en vez de elegidas a mano por el cajero.
 */
@Service
public class PromocionServiceImpl implements PromocionService {

    private final PromocionRepository promocionRepository;
    private final ProductoRepository productoRepository;
    private final AuditoriaService auditoriaService;
    private final NamedParameterJdbcTemplate jdbc;

    public PromocionServiceImpl(PromocionRepository promocionRepository, ProductoRepository productoRepository,
                                 AuditoriaService auditoriaService, NamedParameterJdbcTemplate jdbc) {
        this.promocionRepository = promocionRepository;
        this.productoRepository = productoRepository;
        this.auditoriaService = auditoriaService;
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromocionResponse> listar(Long productoId) {
        StringBuilder sql = new StringBuilder("""
                SELECT pr.*, p.nombre AS producto_nombre, p.precio_venta AS producto_precio_venta
                FROM promociones pr JOIN productos p ON p.id = pr.producto_id
                WHERE 1=1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (productoId != null) {
            sql.append(" AND pr.producto_id = :productoId");
            params.addValue("productoId", productoId);
        }
        sql.append(" ORDER BY pr.fecha_inicio DESC, pr.id DESC");

        LocalDate hoy = CrDateUtils.hoy();
        return jdbc.query(sql.toString(), params, (rs, n) -> {
            LocalDate inicio = rs.getDate("fecha_inicio").toLocalDate();
            LocalDate fin = rs.getDate("fecha_fin").toLocalDate();
            boolean activo = rs.getBoolean("activo");
            boolean vigenteHoy = activo && !hoy.isBefore(inicio) && !hoy.isAfter(fin);
            return PromocionResponse.builder()
                    .id(rs.getLong("id"))
                    .productoId(rs.getLong("producto_id"))
                    .productoNombre(rs.getString("producto_nombre"))
                    .precioVenta(rs.getBigDecimal("producto_precio_venta"))
                    .tipo(TipoPromocion.valueOf(rs.getString("tipo")))
                    .valor(rs.getBigDecimal("valor"))
                    .fechaInicio(inicio)
                    .fechaFin(fin)
                    .activo(activo)
                    .vigenteHoy(vigenteHoy)
                    .creadoEn(rs.getTimestamp("creado_en").toInstant())
                    .build();
        });
    }

    @Override
    @Transactional
    public PromocionResponse crear(PromocionRequest request, AuthenticatedUser usuario) {
        Producto producto = validarYObtenerProducto(request);
        Promocion promocion = Promocion.builder()
                .producto(producto)
                .tipo(request.getTipo())
                .valor(request.getValor())
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .activo(true)
                .build();
        promocion = promocionRepository.save(promocion);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.CREAR, "Promocion",
                promocion.getId(), "Promoción creada para " + producto.getNombre() + ": " + describir(promocion));

        return toResponse(promocion);
    }

    @Override
    @Transactional
    public PromocionResponse actualizar(Long id, PromocionRequest request, AuthenticatedUser usuario) {
        Promocion promocion = promocionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Promoción no encontrada"));

        if (request.getProductoId() != null && !request.getProductoId().equals(promocion.getProducto().getId())) {
            promocion.setProducto(productoRepository.findById(request.getProductoId())
                    .orElseThrow(() -> ApiException.badRequest("Producto no encontrado")));
        }
        if (request.getTipo() != null) promocion.setTipo(request.getTipo());
        if (request.getValor() != null) promocion.setValor(request.getValor());
        if (request.getFechaInicio() != null) promocion.setFechaInicio(request.getFechaInicio());
        if (request.getFechaFin() != null) promocion.setFechaFin(request.getFechaFin());
        if (request.getActivo() != null) promocion.setActivo(request.getActivo());

        validarPromocion(promocion.getTipo(), promocion.getValor(), promocion.getFechaInicio(),
                promocion.getFechaFin(), promocion.getProducto());
        promocion = promocionRepository.save(promocion);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ACTUALIZAR, "Promocion",
                promocion.getId(), "Promoción actualizada para " + promocion.getProducto().getNombre() + ": "
                        + describir(promocion));

        return toResponse(promocion);
    }

    @Override
    @Transactional
    public void eliminar(Long id, AuthenticatedUser usuario) {
        Promocion promocion = promocionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Promoción no encontrada"));
        String nombreProducto = promocion.getProducto().getNombre();
        promocionRepository.delete(promocion);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ELIMINAR, "Promocion", id,
                "Promoción eliminada de " + nombreProducto);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Promocion> promoVigentePara(Long productoId) {
        return promocionRepository.findActivasPorProducto(productoId, CrDateUtils.hoy()).stream().findFirst();
    }

    private Producto validarYObtenerProducto(PromocionRequest request) {
        if (request.getProductoId() == null) {
            throw ApiException.badRequest("Se requiere seleccionar un producto");
        }
        Producto producto = productoRepository.findById(request.getProductoId())
                .orElseThrow(() -> ApiException.badRequest("Producto no encontrado"));
        validarPromocion(request.getTipo(), request.getValor(), request.getFechaInicio(), request.getFechaFin(), producto);
        return producto;
    }

    private void validarPromocion(TipoPromocion tipo, BigDecimal valor, LocalDate fechaInicio, LocalDate fechaFin,
                                   Producto producto) {
        if (tipo == null || valor == null || valor.signum() <= 0) {
            throw ApiException.badRequest("Tipo y valor de la promoción son requeridos");
        }
        if (tipo == TipoPromocion.porcentaje && valor.compareTo(BigDecimal.valueOf(100)) >= 0) {
            throw ApiException.badRequest("El porcentaje de la promoción debe ser menor a 100");
        }
        if (tipo == TipoPromocion.precio_fijo && valor.compareTo(producto.getPrecioVenta()) >= 0) {
            throw ApiException.badRequest("El precio promocional debe ser menor al precio de venta actual (₡"
                    + producto.getPrecioVenta() + ")");
        }
        if (fechaInicio == null || fechaFin == null) {
            throw ApiException.badRequest("La promoción necesita fecha de inicio y de fin");
        }
        if (fechaFin.isBefore(fechaInicio)) {
            throw ApiException.badRequest("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
    }

    private String describir(Promocion p) {
        String rebaja = p.getTipo() == TipoPromocion.porcentaje
                ? p.getValor() + "%"
                : "precio fijo ₡" + p.getValor();
        return rebaja + " del " + p.getFechaInicio() + " al " + p.getFechaFin();
    }

    private PromocionResponse toResponse(Promocion p) {
        LocalDate hoy = CrDateUtils.hoy();
        boolean vigenteHoy = p.isActivo() && !hoy.isBefore(p.getFechaInicio()) && !hoy.isAfter(p.getFechaFin());
        return PromocionResponse.builder()
                .id(p.getId())
                .productoId(p.getProducto().getId())
                .productoNombre(p.getProducto().getNombre())
                .precioVenta(p.getProducto().getPrecioVenta())
                .tipo(p.getTipo())
                .valor(p.getValor())
                .fechaInicio(p.getFechaInicio())
                .fechaFin(p.getFechaFin())
                .activo(p.isActivo())
                .vigenteHoy(vigenteHoy)
                .creadoEn(p.getCreadoEn())
                .build();
    }
}
