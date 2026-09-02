package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.BitacoraResponse;
import com.crmsuper.pos.model.enums.TipoAccion;

import java.util.List;

/**
 * Bitácora de auditoría: registra acciones de negocio significativas
 * (login, ventas, cierres de caja, cambios de precio, altas/bajas de
 * usuarios, etc.) para poder responder después "quién hizo qué y cuándo".
 */
public interface AuditoriaService {

    /**
     * @param usuarioId     id del usuario que hizo la acción, o null si no
     *                      hay usuario identificado (p. ej. login fallido).
     * @param usuarioNombre nombre a mostrar en la bitácora (se guarda tal
     *                      cual, aunque el usuario después cambie de nombre).
     * @param accion        verbo genérico de la acción.
     * @param entidad       tipo de recurso afectado (p. ej. "Producto", "Venta").
     * @param entidadId     id del recurso afectado, o null si no aplica.
     * @param detalle       descripción legible de la acción.
     */
    void registrar(Long usuarioId, String usuarioNombre, TipoAccion accion, String entidad, Long entidadId,
                    String detalle);

    List<BitacoraResponse> listar(Long usuarioId, String entidad, TipoAccion accion, String from, String to);
}
