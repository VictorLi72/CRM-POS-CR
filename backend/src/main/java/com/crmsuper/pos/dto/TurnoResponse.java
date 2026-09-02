package com.crmsuper.pos.dto;

import com.crmsuper.pos.model.enums.EstadoTurno;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.Instant;

public class TurnoResponse {
    private final Long id;
    private final Long usuarioId;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String usuarioNombre;

    private final BigDecimal montoApertura;
    private final BigDecimal efectivoContado;
    private final BigDecimal efectivoEsperado;
    private final BigDecimal diferencia;
    private final String notas;
    private final EstadoTurno estado;
    private final Instant abiertoEn;
    private final Instant cerradoEn;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final TurnoResumen resumen;

    public TurnoResponse(Long id, Long usuarioId, String usuarioNombre, BigDecimal montoApertura,
                          BigDecimal efectivoContado, BigDecimal efectivoEsperado, BigDecimal diferencia,
                          String notas, EstadoTurno estado, Instant abiertoEn, Instant cerradoEn,
                          TurnoResumen resumen) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.usuarioNombre = usuarioNombre;
        this.montoApertura = montoApertura;
        this.efectivoContado = efectivoContado;
        this.efectivoEsperado = efectivoEsperado;
        this.diferencia = diferencia;
        this.notas = notas;
        this.estado = estado;
        this.abiertoEn = abiertoEn;
        this.cerradoEn = cerradoEn;
        this.resumen = resumen;
    }

    public static Builder builder() {
        return new Builder();
    }

    public Long getId() {
        return id;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public String getUsuarioNombre() {
        return usuarioNombre;
    }

    public BigDecimal getMontoApertura() {
        return montoApertura;
    }

    public BigDecimal getEfectivoContado() {
        return efectivoContado;
    }

    public BigDecimal getEfectivoEsperado() {
        return efectivoEsperado;
    }

    public BigDecimal getDiferencia() {
        return diferencia;
    }

    public String getNotas() {
        return notas;
    }

    public EstadoTurno getEstado() {
        return estado;
    }

    public Instant getAbiertoEn() {
        return abiertoEn;
    }

    public Instant getCerradoEn() {
        return cerradoEn;
    }

    public TurnoResumen getResumen() {
        return resumen;
    }

    public static class Builder {
        private Long id;
        private Long usuarioId;
        private String usuarioNombre;
        private BigDecimal montoApertura;
        private BigDecimal efectivoContado;
        private BigDecimal efectivoEsperado;
        private BigDecimal diferencia;
        private String notas;
        private EstadoTurno estado;
        private Instant abiertoEn;
        private Instant cerradoEn;
        private TurnoResumen resumen;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder usuarioId(Long usuarioId) {
            this.usuarioId = usuarioId;
            return this;
        }

        public Builder usuarioNombre(String usuarioNombre) {
            this.usuarioNombre = usuarioNombre;
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

        public Builder resumen(TurnoResumen resumen) {
            this.resumen = resumen;
            return this;
        }

        public TurnoResponse build() {
            return new TurnoResponse(id, usuarioId, usuarioNombre, montoApertura, efectivoContado,
                    efectivoEsperado, diferencia, notas, estado, abiertoEn, cerradoEn, resumen);
        }
    }
}
