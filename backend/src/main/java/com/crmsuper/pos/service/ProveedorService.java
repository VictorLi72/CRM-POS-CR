package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.compra.ProveedorRequest;
import com.crmsuper.pos.dto.compra.ProveedorResponse;

import java.util.List;

public interface ProveedorService {
    List<ProveedorResponse> listar();
    ProveedorResponse crear(ProveedorRequest request);
    ProveedorResponse actualizar(Long id, ProveedorRequest request);
    void eliminar(Long id);
}
