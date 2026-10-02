package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.compra.OrdenCompraRequest;
import com.crmsuper.pos.dto.compra.OrdenCompraResponse;
import com.crmsuper.pos.model.enums.EstadoOrdenCompra;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.OrdenCompraService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordenes-compra")
public class OrdenCompraController {

    private final OrdenCompraService service;

    public OrdenCompraController(OrdenCompraService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrdenCompraResponse crear(@RequestBody OrdenCompraRequest request,
                                      @AuthenticationPrincipal AuthenticatedUser usuario) {
        return service.crear(request, usuario);
    }

    @GetMapping
    public List<OrdenCompraResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public OrdenCompraResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PatchMapping("/{id}/estado")
    public OrdenCompraResponse actualizarEstado(@PathVariable Long id,
                                                 @RequestParam String estado) {
        return service.actualizarEstado(id, EstadoOrdenCompra.valueOf(estado));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        service.eliminar(id);
    }
}
