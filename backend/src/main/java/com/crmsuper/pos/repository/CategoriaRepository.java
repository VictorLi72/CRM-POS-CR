package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findAllByOrderByNombreAsc();
    boolean existsByNombre(String nombre);
}
