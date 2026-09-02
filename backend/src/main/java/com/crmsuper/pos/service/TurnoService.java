package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.TurnoAbrirRequest;
import com.crmsuper.pos.dto.TurnoCerrarRequest;
import com.crmsuper.pos.dto.TurnoResponse;
import com.crmsuper.pos.security.AuthenticatedUser;

import java.util.List;

public interface TurnoService {
    /** @return el turno abierto del usuario, o null si no tiene ninguno abierto. */
    TurnoResponse actual(AuthenticatedUser usuario);
    TurnoResponse abrir(TurnoAbrirRequest request, AuthenticatedUser usuario);
    TurnoResponse cerrar(Long id, TurnoCerrarRequest request, AuthenticatedUser usuario);
    List<TurnoResponse> historial(Long usuarioId, String from, String to);
    TurnoResponse obtener(Long id);
}
