package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.TurnoCaja;
import com.crmsuper.pos.model.enums.EstadoTurno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TurnoCajaRepository extends JpaRepository<TurnoCaja, Long> {
    Optional<TurnoCaja> findFirstByUsuarioIdAndEstadoOrderByAbiertoEnDesc(Long usuarioId, EstadoTurno estado);
}
