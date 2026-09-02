package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.Descuento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DescuentoRepository extends JpaRepository<Descuento, Long> {
    List<Descuento> findAllByOrderByNombreAsc();
    List<Descuento> findAllByActivoTrueOrderByNombreAsc();
}
