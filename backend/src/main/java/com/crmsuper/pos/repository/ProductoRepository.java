package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Optional<Producto> findByCodigoBarrasAndActivoTrue(String codigoBarras);
    boolean existsByCodigoBarras(String codigoBarras);
}
