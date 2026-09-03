package com.crmsuper.pos.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

/**
 * La fecha "de hoy" en hora de Costa Rica (UTC-6, sin horario de verano),
 * derivada de un Instant en vez de la zona horaria del sistema operativo —
 * mismo criterio que usan los reportes para que "hoy" no dependa de en qué
 * PC corra el backend.
 */
public final class CrDateUtils {

    private static final int OFFSET_HORAS = 6;

    private CrDateUtils() {
    }

    public static LocalDate hoy() {
        return Instant.now().minusSeconds(OFFSET_HORAS * 3600L).atZone(ZoneOffset.UTC).toLocalDate();
    }
}
