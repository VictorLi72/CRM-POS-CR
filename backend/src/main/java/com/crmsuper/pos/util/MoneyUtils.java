package com.crmsuper.pos.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Redondeo consistente para montos en colones, usado en cualquier cálculo de
 * venta, devolución o cierre de caja (2 decimales, HALF_UP).
 */
public final class MoneyUtils {

    private MoneyUtils() {
    }

    public static BigDecimal round2(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
