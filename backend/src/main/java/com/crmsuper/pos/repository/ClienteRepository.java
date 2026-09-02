package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByIdentificacion(String identificacion);
    boolean existsByIdentificacion(String identificacion);
}
