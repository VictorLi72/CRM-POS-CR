package com.crmsuper.pos.controller;

import com.crmsuper.pos.dto.LoginRequest;
import com.crmsuper.pos.dto.LoginResponse;
import com.crmsuper.pos.dto.MeResponse;
import com.crmsuper.pos.dto.UserInfo;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal AuthenticatedUser usuario) {
        UserInfo info = UserInfo.builder()
                .id(usuario.id())
                .usuario(usuario.usuario())
                .nombreCompleto(usuario.nombreCompleto())
                .rol(usuario.rol())
                .build();
        return new MeResponse(info);
    }
}
