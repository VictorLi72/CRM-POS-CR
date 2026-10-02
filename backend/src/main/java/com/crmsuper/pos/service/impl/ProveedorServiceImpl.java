package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.compra.ProveedorRequest;
import com.crmsuper.pos.dto.compra.ProveedorResponse;
import com.crmsuper.pos.model.Proveedor;
import com.crmsuper.pos.repository.ProveedorRepository;
import com.crmsuper.pos.service.ProveedorService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProveedorServiceImpl implements ProveedorService {

    private final ProveedorRepository repo;

    public ProveedorServiceImpl(ProveedorRepository repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProveedorResponse> listar() {
        return repo.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProveedorResponse crear(ProveedorRequest req) {
        Proveedor p = new Proveedor();
        apply(p, req);
        return toResponse(repo.save(p));
    }

    @Override
    public ProveedorResponse actualizar(Long id, ProveedorRequest req) {
        Proveedor p = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        apply(p, req);
        return toResponse(repo.save(p));
    }

    @Override
    public void eliminar(Long id) {
        Proveedor p = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        p.setActivo(false);
        repo.save(p);
    }

    private void apply(Proveedor p, ProveedorRequest req) {
        p.setNombre(req.getNombre());
        p.setContacto(req.getContacto());
        p.setTelefono(req.getTelefono());
        p.setEmail(req.getEmail());
        p.setNotas(req.getNotas());
    }

    private ProveedorResponse toResponse(Proveedor p) {
        return new ProveedorResponse(p.getId(), p.getNombre(), p.getContacto(),
                p.getTelefono(), p.getEmail(), p.getNotas(), p.isActivo(), p.getCreadoEn());
    }
}
