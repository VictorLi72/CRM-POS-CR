package com.crmsuper.pos.service;

import com.crmsuper.pos.dto.LoginRequest;
import com.crmsuper.pos.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
}
