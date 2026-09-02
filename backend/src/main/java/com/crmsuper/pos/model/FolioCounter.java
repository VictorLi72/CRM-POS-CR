package com.crmsuper.pos.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Fila única usada como contador atómico del folio consecutivo de ventas.
 * Se bloquea con SELECT ... FOR UPDATE dentro de la transacción de venta para
 * que varias cajas creando ventas al mismo tiempo no repitan folio (en la
 * versión SQLite de un solo proceso esto no hacía falta).
 */
@Entity
@Table(name = "folio_counter")
public class FolioCounter {

    @Id
    private Long id;

    @Column(name = "ultimo_folio", nullable = false)
    private Long ultimoFolio;

    public FolioCounter() {
    }

    public FolioCounter(Long id, Long ultimoFolio) {
        this.id = id;
        this.ultimoFolio = ultimoFolio;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUltimoFolio() {
        return ultimoFolio;
    }

    public void setUltimoFolio(Long ultimoFolio) {
        this.ultimoFolio = ultimoFolio;
    }
}
