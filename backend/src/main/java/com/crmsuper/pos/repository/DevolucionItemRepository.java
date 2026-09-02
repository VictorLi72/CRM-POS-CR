package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.DevolucionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface DevolucionItemRepository extends JpaRepository<DevolucionItem, Long> {
    List<DevolucionItem> findByDevolucionId(Long devolucionId);

    @Query("SELECT COALESCE(SUM(di.cantidad), 0) FROM DevolucionItem di WHERE di.detalleVenta.id = :detalleVentaId")
    BigDecimal sumCantidadByDetalleVentaId(@Param("detalleVentaId") Long detalleVentaId);
}
