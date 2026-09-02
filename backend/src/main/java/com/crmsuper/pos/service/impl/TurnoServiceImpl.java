package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.TotalCantidadRow;
import com.crmsuper.pos.dto.TurnoAbrirRequest;
import com.crmsuper.pos.dto.TurnoCerrarRequest;
import com.crmsuper.pos.dto.TurnoResponse;
import com.crmsuper.pos.dto.TurnoResumen;
import com.crmsuper.pos.dto.VentasPorMetodoRow;
import com.crmsuper.pos.exception.ApiException;
import com.crmsuper.pos.model.TurnoCaja;
import com.crmsuper.pos.model.enums.EstadoTurno;
import com.crmsuper.pos.model.enums.MetodoPago;
import com.crmsuper.pos.model.enums.Rol;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.repository.TurnoCajaRepository;
import com.crmsuper.pos.repository.UsuarioRepository;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.AuditoriaService;
import com.crmsuper.pos.service.TurnoService;
import com.crmsuper.pos.util.MoneyUtils;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

/**
 * Apertura y cierre de turnos de caja (arqueo). Equivalente a
 * backend/src/routes/turnos.js del backend anterior.
 */
@Service
public class TurnoServiceImpl implements TurnoService {

    private final TurnoCajaRepository turnoCajaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final NamedParameterJdbcTemplate jdbc;

    public TurnoServiceImpl(TurnoCajaRepository turnoCajaRepository, UsuarioRepository usuarioRepository,
                             AuditoriaService auditoriaService, NamedParameterJdbcTemplate jdbc) {
        this.turnoCajaRepository = turnoCajaRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaService = auditoriaService;
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(readOnly = true)
    public TurnoResponse actual(AuthenticatedUser usuario) {
        return turnoCajaRepository.findFirstByUsuarioIdAndEstadoOrderByAbiertoEnDesc(usuario.id(), EstadoTurno.abierto)
                .map(t -> toResponse(t, calcularResumen(t.getUsuario().getId(), t.getAbiertoEn(), Instant.now())))
                .orElse(null);
    }

    @Override
    @Transactional
    public TurnoResponse abrir(TurnoAbrirRequest request, AuthenticatedUser usuario) {
        boolean yaAbierto = turnoCajaRepository
                .findFirstByUsuarioIdAndEstadoOrderByAbiertoEnDesc(usuario.id(), EstadoTurno.abierto)
                .isPresent();
        if (yaAbierto) {
            throw ApiException.badRequest("Ya tenés un turno abierto, cerralo antes de abrir uno nuevo");
        }
        TurnoCaja turno = TurnoCaja.builder()
                .usuario(usuarioRepository.getReferenceById(usuario.id()))
                .montoApertura(request.getMontoApertura() != null ? request.getMontoApertura() : BigDecimal.ZERO)
                .estado(EstadoTurno.abierto)
                .build();
        turno = turnoCajaRepository.save(turno);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ABRIR_TURNO, "TurnoCaja",
                turno.getId(), "Apertura con ₡" + turno.getMontoApertura());

        return toResponse(turno, null);
    }

    @Override
    @Transactional
    public TurnoResponse cerrar(Long id, TurnoCerrarRequest request, AuthenticatedUser usuario) {
        TurnoCaja turno = buscar(id);
        boolean esDueño = turno.getUsuario().getId().equals(usuario.id());
        boolean esSupervisorOAdmin = usuario.tieneRol(Rol.administrador, Rol.supervisor);
        if (!esDueño && !esSupervisorOAdmin) {
            throw ApiException.forbidden("No puede cerrar el turno de otro usuario");
        }
        if (turno.getEstado() == EstadoTurno.cerrado) {
            throw ApiException.badRequest("El turno ya está cerrado");
        }
        if (request.getEfectivoContado() == null) {
            throw ApiException.badRequest("Indicá el efectivo contado para cerrar el turno");
        }

        Instant ahora = Instant.now();
        TurnoResumen resumen = calcularResumen(turno.getUsuario().getId(), turno.getAbiertoEn(), ahora);
        BigDecimal efectivoEsperado = MoneyUtils.round2(
                turno.getMontoApertura().add(resumen.getVentasEfectivo()).add(resumen.getAbonosFiado())
                        .subtract(resumen.getDevolucionesEfectivo()));
        BigDecimal diferencia = MoneyUtils.round2(request.getEfectivoContado().subtract(efectivoEsperado));

        turno.setEstado(EstadoTurno.cerrado);
        turno.setEfectivoContado(request.getEfectivoContado());
        turno.setEfectivoEsperado(efectivoEsperado);
        turno.setDiferencia(diferencia);
        turno.setNotas(request.getNotas());
        turno.setCerradoEn(ahora);
        turno = turnoCajaRepository.save(turno);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.CERRAR_TURNO, "TurnoCaja",
                turno.getId(), "Esperado ₡" + efectivoEsperado + ", contado ₡" + request.getEfectivoContado()
                        + ", diferencia ₡" + diferencia);

        return toResponse(turno, resumen);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TurnoResponse> historial(Long usuarioId, String from, String to) {
        StringBuilder sql = new StringBuilder("""
                SELECT t.*, u.nombre_completo AS usuario_nombre
                FROM turnos_caja t JOIN usuarios u ON u.id = t.usuario_id
                WHERE 1=1
                """);
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (usuarioId != null) {
            sql.append(" AND t.usuario_id = :usuarioId");
            params.addValue("usuarioId", usuarioId);
        }
        if (from != null && !from.isBlank()) {
            sql.append(" AND t.abierto_en >= :from");
            params.addValue("from", from);
        }
        if (to != null && !to.isBlank()) {
            sql.append(" AND t.abierto_en <= :to");
            params.addValue("to", to);
        }
        sql.append(" ORDER BY t.abierto_en DESC LIMIT 200");
        return jdbc.query(sql.toString(), params, this::mapTurnoRow);
    }

    @Override
    @Transactional(readOnly = true)
    public TurnoResponse obtener(Long id) {
        TurnoCaja turno = buscar(id);
        Instant hasta = turno.getCerradoEn() != null ? turno.getCerradoEn() : Instant.now();
        TurnoResumen resumen = calcularResumen(turno.getUsuario().getId(), turno.getAbiertoEn(), hasta);
        return toResponse(turno, resumen);
    }

    private TurnoResumen calcularResumen(Long usuarioId, Instant desde, Instant hasta) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("usuarioId", usuarioId)
                .addValue("desde", Timestamp.from(desde))
                .addValue("hasta", Timestamp.from(hasta));

        TotalCantidadRow ventasEfectivo = jdbc.queryForObject("""
                SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS cantidad
                FROM ventas
                WHERE usuario_id = :usuarioId AND metodo_pago = 'efectivo' AND estado = 'completada'
                  AND creado_en >= :desde AND creado_en <= :hasta
                """, params, this::mapTotalCantidad);

        List<VentasPorMetodoRow> ventasPorMetodo = jdbc.query("""
                SELECT metodo_pago, COALESCE(SUM(total), 0) AS total, COUNT(*) AS cantidad
                FROM ventas
                WHERE usuario_id = :usuarioId AND estado = 'completada'
                  AND creado_en >= :desde AND creado_en <= :hasta
                GROUP BY metodo_pago
                """, params, (rs, n) -> VentasPorMetodoRow.builder()
                .metodoPago(MetodoPago.valueOf(rs.getString("metodo_pago")))
                .total(rs.getBigDecimal("total"))
                .cantidad(rs.getLong("cantidad"))
                .build());

        BigDecimal abonosFiado = jdbc.queryForObject("""
                SELECT COALESCE(SUM(monto), 0) FROM pagos_credito
                WHERE usuario_id = :usuarioId AND creado_en >= :desde AND creado_en <= :hasta
                """, params, BigDecimal.class);

        BigDecimal devolucionesEfectivo = jdbc.queryForObject("""
                SELECT COALESCE(SUM(d.total), 0) FROM devoluciones d JOIN ventas v ON v.id = d.venta_id
                WHERE d.usuario_id = :usuarioId AND v.metodo_pago = 'efectivo'
                  AND d.creado_en >= :desde AND d.creado_en <= :hasta
                """, params, BigDecimal.class);

        return TurnoResumen.builder()
                .ventasEfectivo(ventasEfectivo.getTotal())
                .ventasEfectivoCantidad(ventasEfectivo.getCantidad())
                .ventasPorMetodo(ventasPorMetodo)
                .abonosFiado(abonosFiado)
                .devolucionesEfectivo(devolucionesEfectivo)
                .build();
    }

    private TurnoCaja buscar(Long id) {
        return turnoCajaRepository.findById(id).orElseThrow(() -> ApiException.notFound("Turno no encontrado"));
    }

    private TurnoResponse toResponse(TurnoCaja t, TurnoResumen resumen) {
        return TurnoResponse.builder()
                .id(t.getId())
                .usuarioId(t.getUsuario().getId())
                .usuarioNombre(t.getUsuario().getNombreCompleto())
                .montoApertura(t.getMontoApertura())
                .efectivoContado(t.getEfectivoContado())
                .efectivoEsperado(t.getEfectivoEsperado())
                .diferencia(t.getDiferencia())
                .notas(t.getNotas())
                .estado(t.getEstado())
                .abiertoEn(t.getAbiertoEn())
                .cerradoEn(t.getCerradoEn())
                .resumen(resumen)
                .build();
    }

    private TurnoResponse mapTurnoRow(ResultSet rs, int rowNum) throws SQLException {
        Timestamp cerradoEn = rs.getTimestamp("cerrado_en");
        return TurnoResponse.builder()
                .id(rs.getLong("id"))
                .usuarioId(rs.getLong("usuario_id"))
                .usuarioNombre(rs.getString("usuario_nombre"))
                .montoApertura(rs.getBigDecimal("monto_apertura"))
                .efectivoContado(rs.getBigDecimal("efectivo_contado"))
                .efectivoEsperado(rs.getBigDecimal("efectivo_esperado"))
                .diferencia(rs.getBigDecimal("diferencia"))
                .notas(rs.getString("notas"))
                .estado(EstadoTurno.valueOf(rs.getString("estado")))
                .abiertoEn(rs.getTimestamp("abierto_en").toInstant())
                .cerradoEn(cerradoEn != null ? cerradoEn.toInstant() : null)
                .resumen(null)
                .build();
    }

    private TotalCantidadRow mapTotalCantidad(ResultSet rs, int rowNum) throws SQLException {
        return TotalCantidadRow.builder()
                .total(rs.getBigDecimal("total"))
                .cantidad(rs.getLong("cantidad"))
                .build();
    }
}
