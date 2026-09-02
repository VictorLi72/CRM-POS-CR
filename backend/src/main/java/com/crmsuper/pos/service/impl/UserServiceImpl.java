package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.CreateUserRequest;
import com.crmsuper.pos.dto.UpdateUserRequest;
import com.crmsuper.pos.dto.UsuarioResponse;
import com.crmsuper.pos.exception.ApiException;
import com.crmsuper.pos.model.Usuario;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.repository.UsuarioRepository;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.AuditoriaService;
import com.crmsuper.pos.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    public UserServiceImpl(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                            AuditoriaService auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaService = auditoriaService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAllByOrderByNombreCompletoAsc().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {
        return toResponse(buscar(id));
    }

    @Override
    @Transactional
    public UsuarioResponse crear(CreateUserRequest request, AuthenticatedUser usuarioActual) {
        if (usuarioRepository.existsByUsuario(request.getUsername().trim())) {
            throw ApiException.badRequest("Ya existe un usuario con ese nombre de usuario");
        }
        Usuario usuario = Usuario.builder()
                .usuario(request.getUsername().trim())
                .contrasenaHash(passwordEncoder.encode(request.getPassword()))
                .nombreCompleto(request.getNombreCompleto().trim())
                .rol(request.getRol())
                .activo(true)
                .build();
        usuario = usuarioRepository.save(usuario);

        auditoriaService.registrar(usuarioActual.id(), usuarioActual.nombreCompleto(), TipoAccion.CREAR, "Usuario",
                usuario.getId(), "Usuario creado: " + usuario.getUsuario() + " (" + usuario.getRol() + ")");

        return toResponse(usuario);
    }

    @Override
    @Transactional
    public UsuarioResponse actualizar(Long id, UpdateUserRequest request, AuthenticatedUser usuarioActual) {
        Usuario usuario = buscar(id);
        if (request.getNombreCompleto() != null) usuario.setNombreCompleto(request.getNombreCompleto());
        if (request.getRol() != null) usuario.setRol(request.getRol());
        if (request.getActivo() != null) usuario.setActivo(request.getActivo());
        boolean cambioPassword = request.getPassword() != null && !request.getPassword().isBlank();
        if (cambioPassword) {
            usuario.setContrasenaHash(passwordEncoder.encode(request.getPassword()));
        }
        usuario = usuarioRepository.save(usuario);

        String detalle = "Usuario actualizado: " + usuario.getUsuario();
        if (cambioPassword) detalle += " (contraseña restablecida)";
        auditoriaService.registrar(usuarioActual.id(), usuarioActual.nombreCompleto(), TipoAccion.ACTUALIZAR,
                "Usuario", usuario.getId(), detalle);

        return toResponse(usuario);
    }

    @Override
    @Transactional
    public void eliminar(Long id, AuthenticatedUser usuarioActual) {
        if (id.equals(usuarioActual.id())) {
            throw ApiException.badRequest("No puede desactivar su propio usuario");
        }
        Usuario usuario = buscar(id);
        usuario.setActivo(false);
        usuarioRepository.save(usuario);

        auditoriaService.registrar(usuarioActual.id(), usuarioActual.nombreCompleto(), TipoAccion.ELIMINAR,
                "Usuario", id, "Usuario desactivado: " + usuario.getUsuario());
    }

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Usuario no encontrado"));
    }

    private UsuarioResponse toResponse(Usuario usuario) {
        return UsuarioResponse.builder()
                .id(usuario.getId())
                .usuario(usuario.getUsuario())
                .nombreCompleto(usuario.getNombreCompleto())
                .rol(usuario.getRol())
                .activo(usuario.isActivo())
                .creadoEn(usuario.getCreadoEn())
                .build();
    }
}
