package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.MovimientoInventario;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {
    List<MovimientoInventario> findByProductoIdOrderByCreadoEnDesc(Long productoId, Pageable pageable);
}
