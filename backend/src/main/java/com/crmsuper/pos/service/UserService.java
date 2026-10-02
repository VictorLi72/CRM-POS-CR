package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.auth.CreateUserRequest;
import com.crmsuper.pos.dto.auth.UpdateUserRequest;
import com.crmsuper.pos.dto.auth.UsuarioResponse;
import com.crmsuper.pos.security.AuthenticatedUser;

import java.util.List;

public interface UserService {
    List<UsuarioResponse> listar();
    UsuarioResponse obtener(Long id);
    UsuarioResponse crear(CreateUserRequest request, AuthenticatedUser usuarioActual);
    UsuarioResponse actualizar(Long id, UpdateUserRequest request, AuthenticatedUser usuarioActual);
    void eliminar(Long id, AuthenticatedUser usuarioActual);
}
