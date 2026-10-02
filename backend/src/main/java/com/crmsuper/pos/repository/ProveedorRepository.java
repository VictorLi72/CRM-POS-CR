package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
    List<Proveedor> findByActivoTrueOrderByNombreAsc();
}
