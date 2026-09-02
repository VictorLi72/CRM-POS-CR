package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.DescuentoRequest;
import com.crmsuper.pos.model.Descuento;
import com.crmsuper.pos.security.AuthenticatedUser;

import java.util.List;

public interface DiscountService {
    List<Descuento> listar(boolean todos);
    Descuento crear(DescuentoRequest request, AuthenticatedUser usuario);
    Descuento actualizar(Long id, DescuentoRequest request, AuthenticatedUser usuario);
    void eliminar(Long id, AuthenticatedUser usuario);
}
