package com.crmsuper.pos.model;

import com.crmsuper.pos.model.enums.EstadoTurno;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "turnos_caja")
public class TurnoCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "monto_apertura", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoApertura = BigDecimal.ZERO;

    @Column(name = "efectivo_contado", precision = 12, scale = 2)
    private BigDecimal efectivoContado;

    @Column(name = "efectivo_esperado", precision = 12, scale = 2)
    private BigDecimal efectivoEsperado;

    @Column(precision = 12, scale = 2)
    private BigDecimal diferencia;

    private String notas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoTurno estado = EstadoTurno.abierto;

    @CreationTimestamp
    @Column(name = "abierto_en", nullable = false, updatable = false)
    private Instant abiertoEn;

    @Column(name = "cerrado_en")
    private Instant cerradoEn;

    public TurnoCaja() {
    }

    public TurnoCaja(Long id, Usuario usuario, BigDecimal montoApertura, BigDecimal efectivoContado,
                      BigDecimal efectivoEsperado, BigDecimal diferencia, String notas, EstadoTurno estado,
                      Instant abiertoEn, Instant cerradoEn) {
        this.id = id;
        this.usuario = usuario;
        this.montoApertura = montoApertura;
        this.efectivoContado = efectivoContado;
        this.efectivoEsperado = efectivoEsperado;
        this.diferencia = diferencia;
        this.notas = notas;
        this.estado = estado;
        this.abiertoEn = abiertoEn;
        this.cerradoEn = cerradoEn;
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

    public BigDecimal getMontoApertura() {
        return montoApertura;
    }

    public void setMontoApertura(BigDecimal montoApertura) {
        this.montoApertura = montoApertura;
    }

    public BigDecimal getEfectivoContado() {
        return efectivoContado;
    }

    public void setEfectivoContado(BigDecimal efectivoContado) {
        this.efectivoContado = efectivoContado;
    }

    public BigDecimal getEfectivoEsperado() {
        return efectivoEsperado;
    }

    public void setEfectivoEsperado(BigDecimal efectivoEsperado) {
        this.efectivoEsperado = efectivoEsperado;
    }

    public BigDecimal getDiferencia() {
        return diferencia;
    }

    public void setDiferencia(BigDecimal diferencia) {
        this.diferencia = diferencia;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public EstadoTurno getEstado() {
        return estado;
    }

    public void setEstado(EstadoTurno estado) {
        this.estado = estado;
    }

    public Instant getAbiertoEn() {
        return abiertoEn;
    }

    public void setAbiertoEn(Instant abiertoEn) {
        this.abiertoEn = abiertoEn;
    }

    public Instant getCerradoEn() {
        return cerradoEn;
    }

    public void setCerradoEn(Instant cerradoEn) {
        this.cerradoEn = cerradoEn;
    }

    public static class Builder {
        private Long id;
        private Usuario usuario;
        private BigDecimal montoApertura = BigDecimal.ZERO;
        private BigDecimal efectivoContado;
        private BigDecimal efectivoEsperado;
        private BigDecimal diferencia;
        private String notas;
        private EstadoTurno estado = EstadoTurno.abierto;
        private Instant abiertoEn;
        private Instant cerradoEn;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder usuario(Usuario usuario) {
            this.usuario = usuario;
            return this;
        }

        public Builder montoApertura(BigDecimal montoApertura) {
            this.montoApertura = montoApertura;
            return this;
        }

        public Builder efectivoContado(BigDecimal efectivoContado) {
            this.efectivoContado = efectivoContado;
            return this;
        }

        public Builder efectivoEsperado(BigDecimal efectivoEsperado) {
            this.efectivoEsperado = efectivoEsperado;
            return this;
        }

        public Builder diferencia(BigDecimal diferencia) {
            this.diferencia = diferencia;
            return this;
        }

        public Builder notas(String notas) {
            this.notas = notas;
            return this;
        }

        public Builder estado(EstadoTurno estado) {
            this.estado = estado;
            return this;
        }

        public Builder abiertoEn(Instant abiertoEn) {
            this.abiertoEn = abiertoEn;
            return this;
        }

        public Builder cerradoEn(Instant cerradoEn) {
            this.cerradoEn = cerradoEn;
            return this;
        }

        public TurnoCaja build() {
            return new TurnoCaja(id, usuario, montoApertura, efectivoContado, efectivoEsperado, diferencia, notas,
                    estado, abiertoEn, cerradoEn);
        }
    }
}
