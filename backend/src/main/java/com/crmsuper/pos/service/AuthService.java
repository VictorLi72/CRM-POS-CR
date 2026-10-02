package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.auth.LoginRequest;
import com.crmsuper.pos.dto.auth.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
}
