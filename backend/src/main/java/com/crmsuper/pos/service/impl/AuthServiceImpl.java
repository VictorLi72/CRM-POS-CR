package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.LoginRequest;
import com.crmsuper.pos.dto.LoginResponse;
import com.crmsuper.pos.dto.UserInfo;
import com.crmsuper.pos.exception.ApiException;
import com.crmsuper.pos.model.Usuario;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.repository.UsuarioRepository;
import com.crmsuper.pos.security.JwtService;
import com.crmsuper.pos.service.AuditoriaService;
import com.crmsuper.pos.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditoriaService auditoriaService;

    public AuthServiceImpl(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                            JwtService jwtService, AuditoriaService auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditoriaService = auditoriaService;
    }

    @Override
    // No es de solo lectura: también deja constancia en la bitácora del
    // intento de login (exitoso o fallido). noRollbackFor asegura que esa
    // entrada quede guardada aunque el método termine lanzando el 401.
    @Transactional(noRollbackFor = ApiException.class)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByUsuario(request.getUsername()).orElse(null);

        if (usuario == null || !usuario.isActivo()
                || !passwordEncoder.matches(request.getPassword(), usuario.getContrasenaHash())) {
            auditoriaService.registrar(usuario != null ? usuario.getId() : null, request.getUsername(),
                    TipoAccion.LOGIN_FALLIDO, "Auth", null, "Intento de inicio de sesión fallido");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Usuario o contraseña incorrectos");
        }

        String token = jwtService.generarToken(usuario);
        auditoriaService.registrar(usuario.getId(), usuario.getNombreCompleto(), TipoAccion.LOGIN, "Auth",
                usuario.getId(), "Inicio de sesión: " + usuario.getUsuario());

        UserInfo payload = toUserInfo(usuario);
        return new LoginResponse(token, payload);
    }

    private UserInfo toUserInfo(Usuario usuario) {
        return UserInfo.builder()
                .id(usuario.getId())
                .usuario(usuario.getUsuario())
                .nombreCompleto(usuario.getNombreCompleto())
                .rol(usuario.getRol())
                .build();
    }
}
