package com.crmsuper.pos.security;

import com.crmsuper.pos.model.enums.Rol;

/**
 * Equivalente a "req.user" en el backend Express: los datos del usuario
 * autenticado, extraídos del JWT, disponibles en los controllers vía
 * {@code @AuthenticationPrincipal}.
 */
public record AuthenticatedUser(Long id, String usuario, String nombreCompleto, Rol rol) {

    public boolean tieneRol(Rol... roles) {
        for (Rol r : roles) {
            if (r == rol) return true;
        }
        return false;
    }
}
