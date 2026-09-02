package com.crmsuper.pos.repository;

import com.crmsuper.pos.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsuario(String usuario);
    boolean existsByUsuario(String usuario);
    List<Usuario> findAllByOrderByNombreCompletoAsc();
}
