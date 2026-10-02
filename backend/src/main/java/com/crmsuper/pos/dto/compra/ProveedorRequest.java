package com.crmsuper.pos.dto.compra;

public class ProveedorRequest {
    private String nombre;
    private String contacto;
    private String telefono;
    private String email;
    private String notas;

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getContacto() { return contacto; }
    public void setContacto(String contacto) { this.contacto = contacto; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
}
