package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, Long> {
    List<DetalleVenta> findByVentaIdOrderById(Long ventaId);
    Optional<DetalleVenta> findByIdAndVentaId(Long id, Long ventaId);
}
