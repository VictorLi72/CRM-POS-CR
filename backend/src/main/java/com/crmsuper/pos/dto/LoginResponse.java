package com.crmsuper.pos.dto;

public class LoginResponse {
    private final String token;
    private final UserInfo user;

    public LoginResponse(String token, UserInfo user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public UserInfo getUser() {
        return user;
    }
}
