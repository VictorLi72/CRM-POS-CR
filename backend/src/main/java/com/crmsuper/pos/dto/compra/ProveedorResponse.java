package com.crmsuper.pos.dto.compra;

import java.time.Instant;

public class ProveedorResponse {
    private final Long id;
    private final String nombre;
    private final String contacto;
    private final String telefono;
    private final String email;
    private final String notas;
    private final boolean activo;
    private final Instant creadoEn;

    public ProveedorResponse(Long id, String nombre, String contacto, String telefono,
                              String email, String notas, boolean activo, Instant creadoEn) {
        this.id = id;
        this.nombre = nombre;
        this.contacto = contacto;
        this.telefono = telefono;
        this.email = email;
        this.notas = notas;
        this.activo = activo;
        this.creadoEn = creadoEn;
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getContacto() { return contacto; }
    public String getTelefono() { return telefono; }
    public String getEmail() { return email; }
    public String getNotas() { return notas; }
    public boolean isActivo() { return activo; }
    public Instant getCreadoEn() { return creadoEn; }
}
