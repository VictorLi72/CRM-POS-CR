package com.crmsuper.pos.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.crmsuper.pos.dto.pedido.PedidoItemRequest;
import com.crmsuper.pos.dto.pedido.PedidoItemResponse;
import com.crmsuper.pos.dto.pedido.PedidoRequest;
import com.crmsuper.pos.dto.pedido.PedidoResponse;
import com.crmsuper.pos.model.Cliente;
import com.crmsuper.pos.model.Pedido;
import com.crmsuper.pos.model.PedidoItem;
import com.crmsuper.pos.model.Usuario;
import com.crmsuper.pos.model.enums.EstadoPedido;
import com.crmsuper.pos.repository.ClienteRepository;
import com.crmsuper.pos.repository.PedidoItemRepository;
import com.crmsuper.pos.repository.PedidoRepository;
import com.crmsuper.pos.repository.ProductoRepository;
import com.crmsuper.pos.repository.UsuarioRepository;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.PedidoService;

@Service
@Transactional
public class PedidoServiceImpl implements PedidoService {

    private final PedidoRepository pedidoRepo;
    private final PedidoItemRepository itemRepo;
    private final UsuarioRepository usuarioRepo;
    private final ClienteRepository clienteRepo;
    private final ProductoRepository productoRepo;

    public PedidoServiceImpl(PedidoRepository pedidoRepo, PedidoItemRepository itemRepo,
                              UsuarioRepository usuarioRepo, ClienteRepository clienteRepo,
                              ProductoRepository productoRepo) {
        this.pedidoRepo = pedidoRepo;
        this.itemRepo = itemRepo;
        this.usuarioRepo = usuarioRepo;
        this.clienteRepo = clienteRepo;
        this.productoRepo = productoRepo;
    }

    @Override
    public PedidoResponse crear(PedidoRequest req, AuthenticatedUser auth) {
        Usuario usuario = usuarioRepo.findById(auth.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        Pedido pedido = new Pedido();
        pedido.setUsuario(usuario);

        if (req.getClienteId() != null) {
            Cliente cliente = clienteRepo.findById(req.getClienteId()).orElse(null);
            if (cliente != null) {
                pedido.setCliente(cliente);
                pedido.setClienteNombre(cliente.getNombre());
                pedido.setClienteTelefono(cliente.getTelefono());
            }
        } else {
            pedido.setClienteNombre(req.getClienteNombre());
            pedido.setClienteTelefono(req.getClienteTelefono());
        }

        pedido.setNotas(req.getNotas());
        Pedido saved = pedidoRepo.save(pedido);
        saveItems(saved, req.getItems());
        return toResponse(saved, itemRepo.findByPedidoIdOrderById(saved.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PedidoResponse> listar(String estado) {
        List<Pedido> pedidos;
        if (estado != null && !estado.isBlank()) {
            pedidos = pedidoRepo.findByEstadoOrderByCreadoEnDesc(EstadoPedido.valueOf(estado));
        } else {
            pedidos = pedidoRepo.findAllByOrderByCreadoEnDesc();
        }
        return pedidos.stream()
                .map(p -> toResponse(p, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PedidoResponse obtener(Long id) {
        Pedido pedido = findOrThrow(id);
        return toResponse(pedido, itemRepo.findByPedidoIdOrderById(id));
    }

    @Override
    public PedidoResponse actualizarEstado(Long id, EstadoPedido estado, AuthenticatedUser auth) {
        Pedido pedido = findOrThrow(id);
        pedido.setEstado(estado);
        return toResponse(pedidoRepo.save(pedido), itemRepo.findByPedidoIdOrderById(id));
    }

    @Override
    public PedidoResponse actualizar(Long id, PedidoRequest req, AuthenticatedUser auth) {
        Pedido pedido = findOrThrow(id);

        if (req.getClienteId() != null) {
            Cliente cliente = clienteRepo.findById(req.getClienteId()).orElse(null);
            if (cliente != null) {
                pedido.setCliente(cliente);
                pedido.setClienteNombre(cliente.getNombre());
                pedido.setClienteTelefono(cliente.getTelefono());
            }
        } else {
            pedido.setCliente(null);
            pedido.setClienteNombre(req.getClienteNombre());
            pedido.setClienteTelefono(req.getClienteTelefono());
        }

        pedido.setNotas(req.getNotas());
        itemRepo.deleteAll(itemRepo.findByPedidoIdOrderById(id));
        pedidoRepo.save(pedido);
        saveItems(pedido, req.getItems());
        return toResponse(pedido, itemRepo.findByPedidoIdOrderById(id));
    }

    @Override
    public void eliminar(Long id) {
        Pedido pedido = findOrThrow(id);
        pedidoRepo.delete(pedido);
    }

    private void saveItems(Pedido pedido, List<PedidoItemRequest> itemReqs) {
        if (itemReqs == null || itemReqs.isEmpty()) {
            pedido.setTotal(BigDecimal.ZERO);
            pedidoRepo.save(pedido);
            return;
        }
        BigDecimal totalPedido = BigDecimal.ZERO;
        for (PedidoItemRequest ir : itemReqs) {
            PedidoItem item = new PedidoItem();
            item.setPedido(pedido);
            if (ir.getProductoId() != null) {
                productoRepo.findById(ir.getProductoId()).ifPresent(item::setProducto);
            }
            String nombre = ir.getProductoNombre() != null ? ir.getProductoNombre() : "Item";
            item.setProductoNombre(nombre);
            BigDecimal cant = ir.getCantidad() != null ? ir.getCantidad() : BigDecimal.ONE;
            BigDecimal precio = ir.getPrecioUnitario() != null ? ir.getPrecioUnitario() : BigDecimal.ZERO;
            BigDecimal lineTotal = cant.multiply(precio);
            item.setCantidad(cant);
            item.setPrecioUnitario(precio);
            item.setTotal(lineTotal);
            itemRepo.save(item);
            totalPedido = totalPedido.add(lineTotal);
        }
        pedido.setTotal(totalPedido);
        pedidoRepo.save(pedido);
    }

    private Pedido findOrThrow(Long id) {
        return pedidoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido no encontrado"));
    }

    private PedidoResponse toResponse(Pedido p, List<PedidoItem> items) {
        String cajero = p.getUsuario() != null ? p.getUsuario().getNombreCompleto() : null;
        Long clienteId = p.getCliente() != null ? p.getCliente().getId() : null;
        List<PedidoItemResponse> itemResponses = null;
        if (items != null) {
            itemResponses = items.stream().map(i -> new PedidoItemResponse(
                    i.getId(),
                    i.getProducto() != null ? i.getProducto().getId() : null,
                    i.getProductoNombre(),
                    i.getCantidad(),
                    i.getPrecioUnitario(),
                    i.getTotal()
            )).collect(Collectors.toList());
        }
        return new PedidoResponse(p.getId(), cajero, clienteId, p.getClienteNombre(),
                p.getClienteTelefono(), p.getEstado(), p.getNotas(), p.getTotal(),
                p.getCreadoEn(), p.getActualizadoEn(), itemResponses);
    }
}
