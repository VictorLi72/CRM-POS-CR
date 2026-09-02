package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.BitacoraResponse;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.service.AuditoriaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Bitácora de auditoría; solo administrador (ver SecurityConfig). */
@RestController
@RequestMapping("/api/audit")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    public List<BitacoraResponse> listar(
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) String entidad,
            @RequestParam(required = false) TipoAccion accion,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        return auditoriaService.listar(usuarioId, entidad, accion, from, to);
    }
}
