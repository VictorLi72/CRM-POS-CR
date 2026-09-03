package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.PromocionRequest;
import com.crmsuper.pos.dto.PromocionResponse;
import com.crmsuper.pos.model.Promocion;
import com.crmsuper.pos.security.AuthenticatedUser;

import java.util.List;
import java.util.Optional;

public interface PromocionService {
    List<PromocionResponse> listar(Long productoId);
    PromocionResponse crear(PromocionRequest request, AuthenticatedUser usuario);
    PromocionResponse actualizar(Long id, PromocionRequest request, AuthenticatedUser usuario);
    void eliminar(Long id, AuthenticatedUser usuario);

    /** Usado por ProductService/SaleService para calcular el precio efectivo de un producto. */
    Optional<Promocion> promoVigentePara(Long productoId);
}
