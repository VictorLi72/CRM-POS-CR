package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.DescuentoRequest;
import com.crmsuper.pos.model.Descuento;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.DiscountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Descuentos con nombre que el cajero puede elegir en el POS. Cualquier
 * usuario autenticado puede leerlos; solo administrador los administra.
 */
@RestController
@RequestMapping("/api/discounts")
public class DiscountController {

    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @GetMapping
    public List<Descuento> listar(@RequestParam(required = false, defaultValue = "false") boolean all) {
        return discountService.listar(all);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Descuento crear(@RequestBody DescuentoRequest request, @AuthenticationPrincipal AuthenticatedUser usuario) {
        return discountService.crear(request, usuario);
    }

    @PutMapping("/{id}")
    public Descuento actualizar(@PathVariable Long id, @RequestBody DescuentoRequest request,
                                 @AuthenticationPrincipal AuthenticatedUser usuario) {
        return discountService.actualizar(id, request, usuario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser usuario) {
        discountService.eliminar(id, usuario);
        return ResponseEntity.noContent().build();
    }
}
