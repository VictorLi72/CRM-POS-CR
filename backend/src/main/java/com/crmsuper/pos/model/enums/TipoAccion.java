package com.crmsuper.pos.model.enums;

/**
 * Verbo genérico de una entrada de bitácora. Se combina con el campo
 * "entidad" (texto libre, p. ej. "Producto", "Venta") para armar el
 * significado completo de la acción registrada.
 */
public enum TipoAccion {
    LOGIN,
    LOGIN_FALLIDO,
    CREAR,
    ACTUALIZAR,
    ELIMINAR,
    ANULAR,
    DEVOLVER,
    AJUSTAR_STOCK,
    ABRIR_TURNO,
    CERRAR_TURNO,
    REGISTRAR_PAGO
}
