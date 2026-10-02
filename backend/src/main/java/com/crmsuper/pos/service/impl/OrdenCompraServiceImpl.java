package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.compra.*;
import com.crmsuper.pos.model.*;
import com.crmsuper.pos.model.enums.EstadoOrdenCompra;
import com.crmsuper.pos.repository.*;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.OrdenCompraService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class OrdenCompraServiceImpl implements OrdenCompraService {

    private final OrdenCompraRepository ordenRepo;
    private final OrdenCompraItemRepository itemRepo;
    private final UsuarioRepository usuarioRepo;
    private final ProveedorRepository proveedorRepo;
    private final ProductoRepository productoRepo;

    public OrdenCompraServiceImpl(OrdenCompraRepository ordenRepo, OrdenCompraItemRepository itemRepo,
                                   UsuarioRepository usuarioRepo, ProveedorRepository proveedorRepo,
                                   ProductoRepository productoRepo) {
        this.ordenRepo = ordenRepo;
        this.itemRepo = itemRepo;
        this.usuarioRepo = usuarioRepo;
        this.proveedorRepo = proveedorRepo;
        this.productoRepo = productoRepo;
    }

    @Override
    public OrdenCompraResponse crear(OrdenCompraRequest req, AuthenticatedUser auth) {
        Usuario usuario = usuarioRepo.findById(auth.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        OrdenCompra orden = new OrdenCompra();
        orden.setUsuario(usuario);
        orden.setNotas(req.getNotas());

        if (req.getProveedorId() != null) {
            proveedorRepo.findById(req.getProveedorId()).ifPresent(orden::setProveedor);
        }

        OrdenCompra saved = ordenRepo.save(orden);
        saveItems(saved, req.getItems());
        return toResponse(saved, itemRepo.findByOrdenIdOrderById(saved.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrdenCompraResponse> listar() {
        return ordenRepo.findAllByOrderByCreadoEnDesc().stream()
                .map(o -> toResponse(o, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrdenCompraResponse obtener(Long id) {
        OrdenCompra orden = findOrThrow(id);
        return toResponse(orden, itemRepo.findByOrdenIdOrderById(id));
    }

    @Override
    public OrdenCompraResponse actualizarEstado(Long id, EstadoOrdenCompra estado) {
        OrdenCompra orden = findOrThrow(id);
        orden.setEstado(estado);
        return toResponse(ordenRepo.save(orden), itemRepo.findByOrdenIdOrderById(id));
    }

    @Override
    public void eliminar(Long id) {
        ordenRepo.delete(findOrThrow(id));
    }

    private void saveItems(OrdenCompra orden, List<OrdenCompraItemRequest> reqs) {
        if (reqs == null || reqs.isEmpty()) return;
        BigDecimal total = BigDecimal.ZERO;
        for (OrdenCompraItemRequest ir : reqs) {
            OrdenCompraItem item = new OrdenCompraItem();
            item.setOrden(orden);
            if (ir.getProductoId() != null) {
                productoRepo.findById(ir.getProductoId()).ifPresent(item::setProducto);
            }
            item.setProductoNombre(ir.getProductoNombre() != null ? ir.getProductoNombre() : "Item");
            BigDecimal cant = ir.getCantidad() != null ? ir.getCantidad() : BigDecimal.ONE;
            BigDecimal precio = ir.getPrecioUnitario() != null ? ir.getPrecioUnitario() : BigDecimal.ZERO;
            BigDecimal lineTotal = cant.multiply(precio);
            item.setCantidad(cant);
            item.setPrecioUnitario(precio);
            item.setTotal(lineTotal);
            item.setNota(ir.getNota());
            itemRepo.save(item);
            total = total.add(lineTotal);
        }
        orden.setTotal(total);
        ordenRepo.save(orden);
    }

    private OrdenCompra findOrThrow(Long id) {
        return ordenRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orden no encontrada"));
    }

    private OrdenCompraResponse toResponse(OrdenCompra o, List<OrdenCompraItem> items) {
        String cajero = o.getUsuario() != null ? o.getUsuario().getNombreCompleto() : null;
        Long provId = o.getProveedor() != null ? o.getProveedor().getId() : null;
        String provNombre = o.getProveedor() != null ? o.getProveedor().getNombre() : null;
        List<OrdenCompraItemResponse> itemResp = null;
        if (items != null) {
            itemResp = items.stream().map(i -> new OrdenCompraItemResponse(
                    i.getId(),
                    i.getProducto() != null ? i.getProducto().getId() : null,
                    i.getProductoNombre(),
                    i.getCantidad(),
                    i.getPrecioUnitario(),
                    i.getTotal(),
                    i.getNota()
            )).collect(Collectors.toList());
        }
        return new OrdenCompraResponse(o.getId(), cajero, provId, provNombre,
                o.getEstado(), o.getNotas(), o.getTotal(),
                o.getCreadoEn(), o.getActualizadoEn(), itemResp);
    }
}
