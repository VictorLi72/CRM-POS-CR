package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.pedido.PedidoRequest;
import com.crmsuper.pos.dto.pedido.PedidoResponse;
import com.crmsuper.pos.model.enums.EstadoPedido;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.PedidoService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoResponse crear(@RequestBody PedidoRequest request,
                                 @AuthenticationPrincipal AuthenticatedUser usuario) {
        return pedidoService.crear(request, usuario);
    }

    @GetMapping
    public List<PedidoResponse> listar(@RequestParam(required = false) String estado) {
        return pedidoService.listar(estado);
    }

    @GetMapping("/{id}")
    public PedidoResponse obtener(@PathVariable Long id) {
        return pedidoService.obtener(id);
    }

    @PatchMapping("/{id}/estado")
    public PedidoResponse actualizarEstado(@PathVariable Long id,
                                            @RequestParam String estado,
                                            @AuthenticationPrincipal AuthenticatedUser usuario) {
        return pedidoService.actualizarEstado(id, EstadoPedido.valueOf(estado), usuario);
    }

    @PutMapping("/{id}")
    public PedidoResponse actualizar(@PathVariable Long id,
                                      @RequestBody PedidoRequest request,
                                      @AuthenticationPrincipal AuthenticatedUser usuario) {
        return pedidoService.actualizar(id, request, usuario);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        pedidoService.eliminar(id);
    }
}
