package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.DevolucionRequest;
import com.crmsuper.pos.dto.DevolucionResponse;
import com.crmsuper.pos.dto.SaleRequest;
import com.crmsuper.pos.dto.VentaResponse;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.SaleService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Ventas del POS: checkout, consulta, anulación y devoluciones. */
@RestController
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VentaResponse crear(@RequestBody SaleRequest request, @AuthenticationPrincipal AuthenticatedUser usuario) {
        return saleService.crear(request, usuario);
    }

    @GetMapping
    public List<VentaResponse> listar(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String status
    ) {
        return saleService.listar(from, to, userId, status);
    }

    @GetMapping("/by-folio/{folio}")
    public VentaResponse obtenerPorFolio(@PathVariable Long folio) {
        return saleService.obtenerPorFolio(folio);
    }

    @GetMapping("/{id}")
    public VentaResponse obtener(@PathVariable Long id) {
        return saleService.obtenerPorId(id);
    }

    @PostMapping("/{id}/cancel")
    public VentaResponse anular(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser usuario) {
        return saleService.anular(id, usuario);
    }

    @PostMapping("/{id}/devolucion")
    @ResponseStatus(HttpStatus.CREATED)
    public DevolucionResponse devolucion(
            @PathVariable Long id,
            @RequestBody DevolucionRequest request,
            @AuthenticationPrincipal AuthenticatedUser usuario
    ) {
        return saleService.devolucion(id, request, usuario);
    }

    @GetMapping("/{id}/devoluciones")
    public List<DevolucionResponse> devoluciones(@PathVariable Long id) {
        return saleService.devoluciones(id);
    }
}
