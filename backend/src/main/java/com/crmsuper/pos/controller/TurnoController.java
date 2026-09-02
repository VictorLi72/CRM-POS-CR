package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.TurnoAbrirRequest;
import com.crmsuper.pos.dto.TurnoCerrarRequest;
import com.crmsuper.pos.dto.TurnoResponse;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.TurnoService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Apertura/cierre de turnos de caja (arqueo). */
@RestController
@RequestMapping("/api/turnos")
public class TurnoController {

    private final TurnoService turnoService;

    public TurnoController(TurnoService turnoService) {
        this.turnoService = turnoService;
    }

    @GetMapping("/actual")
    public TurnoResponse actual(@AuthenticationPrincipal AuthenticatedUser usuario) {
        return turnoService.actual(usuario);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TurnoResponse abrir(@RequestBody(required = false) TurnoAbrirRequest request, @AuthenticationPrincipal AuthenticatedUser usuario) {
        return turnoService.abrir(request != null ? request : new TurnoAbrirRequest(), usuario);
    }

    @PostMapping("/{id}/cerrar")
    public TurnoResponse cerrar(
            @PathVariable Long id,
            @RequestBody TurnoCerrarRequest request,
            @AuthenticationPrincipal AuthenticatedUser usuario
    ) {
        return turnoService.cerrar(id, request, usuario);
    }

    @GetMapping
    public List<TurnoResponse> historial(
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        return turnoService.historial(usuarioId, from, to);
    }

    @GetMapping("/{id}")
    public TurnoResponse obtener(@PathVariable Long id) {
        return turnoService.obtener(id);
    }
}
