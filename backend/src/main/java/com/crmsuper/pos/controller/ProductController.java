package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.CategoriaRequest;
import com.crmsuper.pos.dto.MovimientoResponse;
import com.crmsuper.pos.dto.ProductoRequest;
import com.crmsuper.pos.dto.ProductoResponse;
import com.crmsuper.pos.dto.StockAdjustRequest;
import com.crmsuper.pos.model.Categoria;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/** Productos, categorías, ajustes de stock y movimientos de inventario. */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // --- Categorías ---

    @GetMapping("/categories")
    public List<Categoria> listarCategorias() {
        return productService.listarCategorias();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public Categoria crearCategoria(@RequestBody CategoriaRequest request, @AuthenticationPrincipal AuthenticatedUser usuario) {
        return productService.crearCategoria(request, usuario);
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> eliminarCategoria(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser usuario) {
        productService.eliminarCategoria(id, usuario);
        return ResponseEntity.noContent().build();
    }

    // --- Productos ---

    @GetMapping
    public List<ProductoResponse> listar(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStock,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean quickAccess,
            @RequestParam(required = false) BigDecimal tarifaIva
    ) {
        return productService.listar(search, lowStock, categoryId, quickAccess, tarifaIva);
    }

    @GetMapping("/barcode/{barcode}")
    public ProductoResponse obtenerPorBarcode(@PathVariable String barcode) {
        return productService.obtenerPorBarcode(barcode);
    }

    @GetMapping("/{id}")
    public ProductoResponse obtener(@PathVariable Long id) {
        return productService.obtenerPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoResponse crear(@RequestBody ProductoRequest request, @AuthenticationPrincipal AuthenticatedUser usuario) {
        return productService.crear(request, usuario);
    }

    @PutMapping("/{id}")
    public ProductoResponse actualizar(@PathVariable Long id, @RequestBody ProductoRequest request,
                                        @AuthenticationPrincipal AuthenticatedUser usuario) {
        return productService.actualizar(id, request, usuario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser usuario) {
        productService.eliminar(id, usuario);
        return ResponseEntity.noContent().build();
    }

    // --- Inventario ---

    @PostMapping("/{id}/stock")
    public ProductoResponse ajustarStock(
            @PathVariable Long id,
            @RequestBody StockAdjustRequest request,
            @AuthenticationPrincipal AuthenticatedUser usuario
    ) {
        return productService.ajustarStock(id, request, usuario);
    }

    @GetMapping("/{id}/movements")
    public List<MovimientoResponse> movimientos(@PathVariable Long id) {
        return productService.movimientos(id);
    }
}
