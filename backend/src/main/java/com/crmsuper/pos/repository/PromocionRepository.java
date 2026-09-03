package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.Promocion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface PromocionRepository extends JpaRepository<Promocion, Long> {

    List<Promocion> findByProductoIdOrderByFechaInicioDesc(Long productoId);

    @Query("SELECT p FROM Promocion p WHERE p.producto.id = :productoId AND p.activo = true "
            + "AND p.fechaInicio <= :hoy AND p.fechaFin >= :hoy ORDER BY p.id DESC")
    List<Promocion> findActivasPorProducto(@Param("productoId") Long productoId, @Param("hoy") LocalDate hoy);
}
