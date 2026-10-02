package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.PedidoItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PedidoItemRepository extends JpaRepository<PedidoItem, Long> {
    List<PedidoItem> findByPedidoIdOrderById(Long pedidoId);
}
