package com.crmsuper.pos.dto;

import java.util.List;

public class DevolucionRequest {
    private List<DevolucionItemRequest> items;
    private String motivo;

    public List<DevolucionItemRequest> getItems() {
        return items;
    }

    public void setItems(List<DevolucionItemRequest> items) {
        this.items = items;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
