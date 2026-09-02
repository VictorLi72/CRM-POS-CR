package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.Devolucion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DevolucionRepository extends JpaRepository<Devolucion, Long> {
    List<Devolucion> findByVentaIdOrderByCreadoEnDesc(Long ventaId);
}
