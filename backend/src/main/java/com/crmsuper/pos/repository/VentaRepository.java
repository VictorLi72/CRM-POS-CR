package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    Optional<Venta> findByFolio(Long folio);
}
