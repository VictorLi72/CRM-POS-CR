package com.crmsuper.pos.dto;

public class MeResponse {
    private final UserInfo user;

    public MeResponse(UserInfo user) {
        this.user = user;
    }

    public UserInfo getUser() {
        return user;
    }
}
