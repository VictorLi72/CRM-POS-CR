package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.PromocionRequest;
import com.crmsuper.pos.dto.PromocionResponse;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.PromocionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Promociones por producto (rebaja automática en el POS mientras esté
 * vigente). Cualquier usuario autenticado puede leerlas; solo administrador
 * o supervisor las administran (ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/promotions")
public class PromocionController {

    private final PromocionService promocionService;

    public PromocionController(PromocionService promocionService) {
        this.promocionService = promocionService;
    }

    @GetMapping
    public List<PromocionResponse> listar(@RequestParam(required = false) Long productoId) {
        return promocionService.listar(productoId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PromocionResponse crear(@RequestBody PromocionRequest request, @AuthenticationPrincipal AuthenticatedUser usuario) {
        return promocionService.crear(request, usuario);
    }

    @PutMapping("/{id}")
    public PromocionResponse actualizar(@PathVariable Long id, @RequestBody PromocionRequest request,
                                         @AuthenticationPrincipal AuthenticatedUser usuario) {
        return promocionService.actualizar(id, request, usuario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser usuario) {
        promocionService.eliminar(id, usuario);
        return ResponseEntity.noContent().build();
    }
}
