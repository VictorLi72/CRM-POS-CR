package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.TarifaIva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;

public interface TarifaIvaRepository extends JpaRepository<TarifaIva, Long> {
    List<TarifaIva> findAllByOrderByPorcentajeAsc();
    List<TarifaIva> findAllByActivoTrueOrderByPorcentajeAsc();
    boolean existsByPorcentaje(BigDecimal porcentaje);
}
