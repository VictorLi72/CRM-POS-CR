package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.compra.OrdenCompraRequest;
import com.crmsuper.pos.dto.compra.OrdenCompraResponse;
import com.crmsuper.pos.model.enums.EstadoOrdenCompra;
import com.crmsuper.pos.security.AuthenticatedUser;

import java.util.List;

public interface OrdenCompraService {
    OrdenCompraResponse crear(OrdenCompraRequest request, AuthenticatedUser usuario);
    List<OrdenCompraResponse> listar();
    OrdenCompraResponse obtener(Long id);
    OrdenCompraResponse actualizarEstado(Long id, EstadoOrdenCompra estado);
    void eliminar(Long id);
}
