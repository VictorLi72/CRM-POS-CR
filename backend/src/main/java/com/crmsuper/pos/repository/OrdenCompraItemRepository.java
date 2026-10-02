package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.OrdenCompraItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdenCompraItemRepository extends JpaRepository<OrdenCompraItem, Long> {
    List<OrdenCompraItem> findByOrdenIdOrderById(Long ordenId);
}
