package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.TarifaIvaRequest;
import com.crmsuper.pos.model.TarifaIva;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.TaxRateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Catálogo de tarifas de IVA disponibles para productos. Cualquier usuario
 * autenticado puede leerlas; solo administrador las administra.
 */
@RestController
@RequestMapping("/api/tax-rates")
public class TaxRateController {

    private final TaxRateService taxRateService;

    public TaxRateController(TaxRateService taxRateService) {
        this.taxRateService = taxRateService;
    }

    @GetMapping
    public List<TarifaIva> listar(@RequestParam(required = false, defaultValue = "false") boolean all) {
        return taxRateService.listar(all);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TarifaIva crear(@RequestBody TarifaIvaRequest request, @AuthenticationPrincipal AuthenticatedUser usuario) {
        return taxRateService.crear(request, usuario);
    }

    @PutMapping("/{id}")
    public TarifaIva actualizar(@PathVariable Long id, @RequestBody TarifaIvaRequest request,
                                 @AuthenticationPrincipal AuthenticatedUser usuario) {
        return taxRateService.actualizar(id, request, usuario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser usuario) {
        taxRateService.eliminar(id, usuario);
        return ResponseEntity.noContent().build();
    }
}
