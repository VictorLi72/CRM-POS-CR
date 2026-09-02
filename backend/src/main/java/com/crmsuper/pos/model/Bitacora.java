package com.crmsuper.pos.model;

import com.crmsuper.pos.model.enums.TipoAccion;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Entrada de la bitácora de auditoría: quién hizo qué, cuándo, y sobre qué
 * registro. "usuarioNombre" queda denormalizado (igual que
 * detalle_ventas.producto_nombre) para que la bitácora siga siendo legible
 * aunque el usuario después se desactive o cambie de nombre.
 */
@Entity
@Table(name = "bitacora")
public class Bitacora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(name = "usuario_nombre")
    private String usuarioNombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoAccion accion;

    @Column(nullable = false, length = 50)
    private String entidad;

    @Column(name = "entidad_id")
    private Long entidadId;

    @Column(columnDefinition = "TEXT")
    private String detalle;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    public Bitacora() {
    }

    public Bitacora(Long id, Usuario usuario, String usuarioNombre, TipoAccion accion, String entidad,
                     Long entidadId, String detalle, Instant creadoEn) {
        this.id = id;
        this.usuario = usuario;
        this.usuarioNombre = usuarioNombre;
        this.accion = accion;
        this.entidad = entidad;
        this.entidadId = entidadId;
        this.detalle = detalle;
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

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getUsuarioNombre() {
        return usuarioNombre;
    }

    public void setUsuarioNombre(String usuarioNombre) {
        this.usuarioNombre = usuarioNombre;
    }

    public TipoAccion getAccion() {
        return accion;
    }

    public void setAccion(TipoAccion accion) {
        this.accion = accion;
    }

    public String getEntidad() {
        return entidad;
    }

    public void setEntidad(String entidad) {
        this.entidad = entidad;
    }

    public Long getEntidadId() {
        return entidadId;
    }

    public void setEntidadId(Long entidadId) {
        this.entidadId = entidadId;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }

    public static class Builder {
        private Long id;
        private Usuario usuario;
        private String usuarioNombre;
        private TipoAccion accion;
        private String entidad;
        private Long entidadId;
        private String detalle;
        private Instant creadoEn;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder usuario(Usuario usuario) {
            this.usuario = usuario;
            return this;
        }

        public Builder usuarioNombre(String usuarioNombre) {
            this.usuarioNombre = usuarioNombre;
            return this;
        }

        public Builder accion(TipoAccion accion) {
            this.accion = accion;
            return this;
        }

        public Builder entidad(String entidad) {
            this.entidad = entidad;
            return this;
        }

        public Builder entidadId(Long entidadId) {
            this.entidadId = entidadId;
            return this;
        }

        public Builder detalle(String detalle) {
            this.detalle = detalle;
            return this;
        }

        public Builder creadoEn(Instant creadoEn) {
            this.creadoEn = creadoEn;
            return this;
        }

        public Bitacora build() {
            return new Bitacora(id, usuario, usuarioNombre, accion, entidad, entidadId, detalle, creadoEn);
        }
    }
}
