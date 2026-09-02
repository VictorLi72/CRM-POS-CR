package com.crmsuper.pos.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column(unique = true)
    private String identificacion;

    private String telefono;

    private String correo;

    private String direccion;

    @Column(name = "limite_credito", nullable = false, precision = 12, scale = 2)
    private BigDecimal limiteCredito = BigDecimal.ZERO;

    @Column(name = "saldo_credito", nullable = false, precision = 12, scale = 2)
    private BigDecimal saldoCredito = BigDecimal.ZERO;

    @Column(name = "puntos_lealtad", nullable = false)
    private Integer puntosLealtad = 0;

    @Column(nullable = false)
    private boolean activo = true;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    public Cliente() {
    }

    public Cliente(Long id, String nombre, String identificacion, String telefono, String correo,
                    String direccion, BigDecimal limiteCredito, BigDecimal saldoCredito, Integer puntosLealtad,
                    boolean activo, Instant creadoEn) {
        this.id = id;
        this.nombre = nombre;
        this.identificacion = identificacion;
        this.telefono = telefono;
        this.correo = correo;
        this.direccion = direccion;
        this.limiteCredito = limiteCredito;
        this.saldoCredito = saldoCredito;
        this.puntosLealtad = puntosLealtad;
        this.activo = activo;
        this.creadoEn = creadoEn;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getIdentificacion() {
        return identificacion;
    }

    public void setIdentificacion(String identificacion) {
        this.identificacion = identificacion;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public BigDecimal getLimiteCredito() {
        return limiteCredito;
    }

    public void setLimiteCredito(BigDecimal limiteCredito) {
        this.limiteCredito = limiteCredito;
    }

    public BigDecimal getSaldoCredito() {
        return saldoCredito;
    }

    public void setSaldoCredito(BigDecimal saldoCredito) {
        this.saldoCredito = saldoCredito;
    }

    public Integer getPuntosLealtad() {
        return puntosLealtad;
    }

    public void setPuntosLealtad(Integer puntosLealtad) {
        this.puntosLealtad = puntosLealtad;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }

    public static class Builder {
        private Long id;
        private String nombre;
        private String identificacion;
        private String telefono;
        private String correo;
        private String direccion;
        private BigDecimal limiteCredito = BigDecimal.ZERO;
        private BigDecimal saldoCredito = BigDecimal.ZERO;
        private Integer puntosLealtad = 0;
        private boolean activo = true;
        private Instant creadoEn;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder nombre(String nombre) {
            this.nombre = nombre;
            return this;
        }

        public Builder identificacion(String identificacion) {
            this.identificacion = identificacion;
            return this;
        }

        public Builder telefono(String telefono) {
            this.telefono = telefono;
            return this;
        }

        public Builder correo(String correo) {
            this.correo = correo;
            return this;
        }

        public Builder direccion(String direccion) {
            this.direccion = direccion;
            return this;
        }

        public Builder limiteCredito(BigDecimal limiteCredito) {
            this.limiteCredito = limiteCredito;
            return this;
        }

        public Builder saldoCredito(BigDecimal saldoCredito) {
            this.saldoCredito = saldoCredito;
            return this;
        }

        public Builder puntosLealtad(Integer puntosLealtad) {
            this.puntosLealtad = puntosLealtad;
            return this;
        }

        public Builder activo(boolean activo) {
            this.activo = activo;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public Cliente build() {
            return new Cliente(id, nombre, identificacion, telefono, correo, direccion, limiteCredito,
                    saldoCredito, puntosLealtad, activo, creadoEn);
        }
    }
}
