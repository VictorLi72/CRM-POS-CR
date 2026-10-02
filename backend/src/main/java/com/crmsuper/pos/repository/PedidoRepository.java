package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.Pedido;
import com.crmsuper.pos.model.enums.EstadoPedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByEstadoOrderByCreadoEnDesc(EstadoPedido estado);
    List<Pedido> findAllByOrderByCreadoEnDesc();
}
