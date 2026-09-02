package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.TarifaIvaRequest;
import com.crmsuper.pos.model.TarifaIva;
import com.crmsuper.pos.security.AuthenticatedUser;

import java.util.List;

public interface TaxRateService {
    List<TarifaIva> listar(boolean todas);
    TarifaIva crear(TarifaIvaRequest request, AuthenticatedUser usuario);
    TarifaIva actualizar(Long id, TarifaIvaRequest request, AuthenticatedUser usuario);
    void eliminar(Long id, AuthenticatedUser usuario);
}
