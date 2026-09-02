package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.ClienteRequest;
import com.crmsuper.pos.dto.PagoCreditoResponse;
import com.crmsuper.pos.dto.PaymentRequest;
import com.crmsuper.pos.dto.VentaResponse;
import com.crmsuper.pos.model.Cliente;
import com.crmsuper.pos.security.AuthenticatedUser;

import java.util.List;

public interface CustomerService {
    List<Cliente> listar(String search);
    Cliente obtener(Long id);
    List<VentaResponse> ventas(Long clienteId);
    List<PagoCreditoResponse> pagos(Long clienteId);
    Cliente crear(ClienteRequest request, AuthenticatedUser usuario);
    Cliente actualizar(Long id, ClienteRequest request, AuthenticatedUser usuario);
    void eliminar(Long id, AuthenticatedUser usuario);
    Cliente registrarPago(Long id, PaymentRequest request, AuthenticatedUser usuario);
}
