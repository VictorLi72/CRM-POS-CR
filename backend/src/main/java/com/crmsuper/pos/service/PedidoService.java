package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.pedido.PedidoRequest;
import com.crmsuper.pos.dto.pedido.PedidoResponse;
import com.crmsuper.pos.model.enums.EstadoPedido;
import com.crmsuper.pos.security.AuthenticatedUser;

import java.util.List;

public interface PedidoService {
    PedidoResponse crear(PedidoRequest request, AuthenticatedUser usuario);
    List<PedidoResponse> listar(String estado);
    PedidoResponse obtener(Long id);
    PedidoResponse actualizarEstado(Long id, EstadoPedido estado, AuthenticatedUser usuario);
    PedidoResponse actualizar(Long id, PedidoRequest request, AuthenticatedUser usuario);
    void eliminar(Long id);
}
