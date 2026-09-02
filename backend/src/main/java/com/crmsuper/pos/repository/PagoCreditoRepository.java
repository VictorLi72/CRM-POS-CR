package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.PagoCredito;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PagoCreditoRepository extends JpaRepository<PagoCredito, Long> {
    List<PagoCredito> findByClienteIdOrderByCreadoEnDesc(Long clienteId);
}
