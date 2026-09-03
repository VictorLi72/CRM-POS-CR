package com.crmsuper.pos.util;

import com.crmsuper.pos.model.Promocion;
import com.crmsuper.pos.model.enums.TipoPromocion;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Calcula el precio efectivo (con promoción aplicada) de un producto. */
public final class PromocionUtils {

    private PromocionUtils() {
    }

    public static BigDecimal precioEfectivo(BigDecimal precioVenta, Promocion promo) {
        return precioEfectivo(precioVenta, promo.getTipo(), promo.getValor());
    }

    public static BigDecimal precioEfectivo(BigDecimal precioVenta, TipoPromocion tipo, BigDecimal valor) {
        if (tipo == TipoPromocion.precio_fijo) {
            return valor;
        }
        BigDecimal factor = BigDecimal.ONE.subtract(valor.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP));
        return precioVenta.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }
}
