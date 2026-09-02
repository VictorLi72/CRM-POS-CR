package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.CreateUserRequest;
import com.crmsuper.pos.dto.UpdateUserRequest;
import com.crmsuper.pos.dto.UsuarioResponse;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Gestión de usuarios del sistema; solo accesible para administradores (ver SecurityConfig). */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return userService.listar();
    }

    @GetMapping("/{id}")
    public UsuarioResponse obtener(@PathVariable Long id) {
        return userService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse crear(@Valid @RequestBody CreateUserRequest request,
                                  @AuthenticationPrincipal AuthenticatedUser usuarioActual) {
        return userService.crear(request, usuarioActual);
    }

    @PutMapping("/{id}")
    public UsuarioResponse actualizar(@PathVariable Long id, @RequestBody UpdateUserRequest request,
                                       @AuthenticationPrincipal AuthenticatedUser usuarioActual) {
        return userService.actualizar(id, request, usuarioActual);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser usuarioActual) {
        userService.eliminar(id, usuarioActual);
        return ResponseEntity.noContent().build();
    }
}
