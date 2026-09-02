package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.ClienteRequest;
import com.crmsuper.pos.dto.PagoCreditoResponse;
import com.crmsuper.pos.dto.PaymentRequest;
import com.crmsuper.pos.dto.VentaResponse;
import com.crmsuper.pos.exception.ApiException;
import com.crmsuper.pos.model.Cliente;
import com.crmsuper.pos.model.PagoCredito;
import com.crmsuper.pos.model.enums.EstadoVenta;
import com.crmsuper.pos.model.enums.MetodoPago;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.repository.ClienteRepository;
import com.crmsuper.pos.repository.PagoCreditoRepository;
import com.crmsuper.pos.repository.UsuarioRepository;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.AuditoriaService;
import com.crmsuper.pos.service.CustomerService;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CustomerServiceImpl implements CustomerService {

    private final ClienteRepository clienteRepository;
    private final PagoCreditoRepository pagoCreditoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;
    private final NamedParameterJdbcTemplate jdbc;

    public CustomerServiceImpl(
            ClienteRepository clienteRepository,
            PagoCreditoRepository pagoCreditoRepository,
            UsuarioRepository usuarioRepository,
            AuditoriaService auditoriaService,
            NamedParameterJdbcTemplate jdbc
    ) {
        this.clienteRepository = clienteRepository;
        this.pagoCreditoRepository = pagoCreditoRepository;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaService = auditoriaService;
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Cliente> listar(String search) {
        StringBuilder sql = new StringBuilder("SELECT id FROM clientes WHERE activo = 1");
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (search != null && !search.isBlank()) {
            sql.append(" AND (nombre LIKE :s OR identificacion LIKE :s OR telefono LIKE :s)");
            params.addValue("s", "%" + search + "%");
        }
        sql.append(" ORDER BY nombre");
        // Cliente no tiene relaciones que aplanar: se resuelven los ids con SQL
        // dinámico y se hidratan las entidades vía JPA para reusar el mapeo.
        List<Long> ids = jdbc.query(sql.toString(), params, (rs, n) -> rs.getLong("id"));
        return ids.stream().map(id -> clienteRepository.findById(id).orElseThrow()).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Cliente obtener(Long id) {
        return buscar(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VentaResponse> ventas(Long clienteId) {
        String sql = """
                SELECT v.*, u.nombre_completo AS cajero_nombre
                FROM ventas v LEFT JOIN usuarios u ON u.id = v.usuario_id
                WHERE v.cliente_id = :clienteId ORDER BY v.creado_en DESC LIMIT 200
                """;
        return jdbc.query(sql, new MapSqlParameterSource("clienteId", clienteId), (rs, n) -> VentaResponse.builder()
                .id(rs.getLong("id"))
                .folio(rs.getLong("folio"))
                .usuarioId(rs.getLong("usuario_id"))
                .cajeroNombre(rs.getString("cajero_nombre"))
                .clienteId(rs.getObject("cliente_id") != null ? rs.getLong("cliente_id") : null)
                .subtotal(rs.getBigDecimal("subtotal"))
                .descuentoTotal(rs.getBigDecimal("descuento_total"))
                .ivaTotal(rs.getBigDecimal("iva_total"))
                .total(rs.getBigDecimal("total"))
                .metodoPago(MetodoPago.valueOf(rs.getString("metodo_pago")))
                .montoRecibido(rs.getBigDecimal("monto_recibido"))
                .vuelto(rs.getBigDecimal("vuelto"))
                .estado(EstadoVenta.valueOf(rs.getString("estado")))
                .creadoEn(rs.getTimestamp("creado_en").toInstant())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PagoCreditoResponse> pagos(Long clienteId) {
        return pagoCreditoRepository.findByClienteIdOrderByCreadoEnDesc(clienteId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public Cliente crear(ClienteRequest request, AuthenticatedUser usuario) {
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw ApiException.badRequest("El nombre es requerido");
        }
        if (request.getIdentificacion() != null && !request.getIdentificacion().isBlank()
                && clienteRepository.existsByIdentificacion(request.getIdentificacion())) {
            throw ApiException.badRequest("Ya existe un cliente con esa identificación");
        }
        Cliente cliente = Cliente.builder()
                .nombre(request.getNombre().trim())
                .identificacion(blankToNull(request.getIdentificacion()))
                .telefono(blankToNull(request.getTelefono()))
                .correo(blankToNull(request.getCorreo()))
                .direccion(blankToNull(request.getDireccion()))
                .limiteCredito(request.getLimiteCredito() != null ? request.getLimiteCredito() : BigDecimal.ZERO)
                .saldoCredito(BigDecimal.ZERO)
                .puntosLealtad(0)
                .activo(true)
                .build();
        cliente = clienteRepository.save(cliente);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.CREAR, "Cliente",
                cliente.getId(), "Cliente creado: " + cliente.getNombre());

        return cliente;
    }

    @Override
    @Transactional
    public Cliente actualizar(Long id, ClienteRequest request, AuthenticatedUser usuario) {
        Cliente existente = buscar(id);
        if (request.getNombre() != null) existente.setNombre(request.getNombre());
        if (request.getIdentificacion() != null) existente.setIdentificacion(blankToNull(request.getIdentificacion()));
        if (request.getTelefono() != null) existente.setTelefono(blankToNull(request.getTelefono()));
        if (request.getCorreo() != null) existente.setCorreo(blankToNull(request.getCorreo()));
        if (request.getDireccion() != null) existente.setDireccion(blankToNull(request.getDireccion()));
        if (request.getLimiteCredito() != null) existente.setLimiteCredito(request.getLimiteCredito());
        existente = clienteRepository.save(existente);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ACTUALIZAR, "Cliente",
                existente.getId(), "Cliente actualizado: " + existente.getNombre());

        return existente;
    }

    @Override
    @Transactional
    public void eliminar(Long id, AuthenticatedUser usuario) {
        Cliente cliente = buscar(id);
        cliente.setActivo(false);
        clienteRepository.save(cliente);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ELIMINAR, "Cliente", id,
                "Cliente desactivado: " + cliente.getNombre());
    }

    @Override
    @Transactional
    public Cliente registrarPago(Long id, PaymentRequest request, AuthenticatedUser usuario) {
        if (request.getMonto() == null || request.getMonto().signum() <= 0) {
            throw ApiException.badRequest("Monto inválido");
        }
        Cliente cliente = buscar(id);
        if (request.getMonto().compareTo(cliente.getSaldoCredito()) > 0) {
            throw ApiException.badRequest("El monto excede el saldo pendiente");
        }
        cliente.setSaldoCredito(cliente.getSaldoCredito().subtract(request.getMonto()));
        clienteRepository.save(cliente);

        pagoCreditoRepository.save(PagoCredito.builder()
                .cliente(cliente)
                .monto(request.getMonto())
                .usuario(usuarioRepository.getReferenceById(usuario.id()))
                .build());

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.REGISTRAR_PAGO, "Cliente",
                cliente.getId(), "Abono de ₡" + request.getMonto() + " para " + cliente.getNombre());

        return cliente;
    }

    private Cliente buscar(Long id) {
        return clienteRepository.findById(id).orElseThrow(() -> ApiException.notFound("Cliente no encontrado"));
    }

    private PagoCreditoResponse toResponse(PagoCredito p) {
        return PagoCreditoResponse.builder()
                .id(p.getId())
                .clienteId(p.getCliente().getId())
                .ventaId(p.getVenta() != null ? p.getVenta().getId() : null)
                .monto(p.getMonto())
                .usuarioId(p.getUsuario() != null ? p.getUsuario().getId() : null)
                .creadoEn(p.getCreadoEn())
                .build();
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
