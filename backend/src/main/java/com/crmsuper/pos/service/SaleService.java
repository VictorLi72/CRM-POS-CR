package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.DevolucionRequest;
import com.crmsuper.pos.dto.DevolucionResponse;
import com.crmsuper.pos.dto.SaleRequest;
import com.crmsuper.pos.dto.VentaResponse;
import com.crmsuper.pos.security.AuthenticatedUser;

import java.util.List;

public interface SaleService {
    VentaResponse crear(SaleRequest request, AuthenticatedUser usuario);
    List<VentaResponse> listar(String from, String to, Long userId, String status);
    VentaResponse obtenerPorFolio(Long folio);
    VentaResponse obtenerPorId(Long id);
    VentaResponse anular(Long id, AuthenticatedUser usuario);
    DevolucionResponse devolucion(Long ventaId, DevolucionRequest request, AuthenticatedUser usuario);
    List<DevolucionResponse> devoluciones(Long ventaId);
}
