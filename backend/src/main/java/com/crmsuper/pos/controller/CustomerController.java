package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.ClienteRequest;
import com.crmsuper.pos.dto.PagoCreditoResponse;
import com.crmsuper.pos.dto.PaymentRequest;
import com.crmsuper.pos.dto.VentaResponse;
import com.crmsuper.pos.model.Cliente;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Clientes (CRM) y cuentas fiadas. */
@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public List<Cliente> listar(@RequestParam(required = false) String search) {
        return customerService.listar(search);
    }

    @GetMapping("/{id}")
    public Cliente obtener(@PathVariable Long id) {
        return customerService.obtener(id);
    }

    @GetMapping("/{id}/sales")
    public List<VentaResponse> ventas(@PathVariable Long id) {
        return customerService.ventas(id);
    }

    @GetMapping("/{id}/payments")
    public List<PagoCreditoResponse> pagos(@PathVariable Long id) {
        return customerService.pagos(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Cliente crear(@RequestBody ClienteRequest request, @AuthenticationPrincipal AuthenticatedUser usuario) {
        return customerService.crear(request, usuario);
    }

    @PutMapping("/{id}")
    public Cliente actualizar(@PathVariable Long id, @RequestBody ClienteRequest request,
                               @AuthenticationPrincipal AuthenticatedUser usuario) {
        return customerService.actualizar(id, request, usuario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser usuario) {
        customerService.eliminar(id, usuario);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public Cliente registrarPago(
            @PathVariable Long id,
            @RequestBody PaymentRequest request,
            @AuthenticationPrincipal AuthenticatedUser usuario
    ) {
        return customerService.registrarPago(id, request, usuario);
    }
}
