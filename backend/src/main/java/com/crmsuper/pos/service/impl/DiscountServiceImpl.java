package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.DescuentoRequest;
import com.crmsuper.pos.exception.ApiException;
import com.crmsuper.pos.model.Descuento;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.model.enums.TipoDescuento;
import com.crmsuper.pos.repository.DescuentoRepository;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.AuditoriaService;
import com.crmsuper.pos.service.DiscountService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DiscountServiceImpl implements DiscountService {

    private final DescuentoRepository descuentoRepository;
    private final AuditoriaService auditoriaService;

    public DiscountServiceImpl(DescuentoRepository descuentoRepository, AuditoriaService auditoriaService) {
        this.descuentoRepository = descuentoRepository;
        this.auditoriaService = auditoriaService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Descuento> listar(boolean todos) {
        return todos ? descuentoRepository.findAllByOrderByNombreAsc()
                : descuentoRepository.findAllByActivoTrueOrderByNombreAsc();
    }

    @Override
    @Transactional
    public Descuento crear(DescuentoRequest request, AuthenticatedUser usuario) {
        if (request.getNombre() == null || request.getNombre().isBlank()
                || request.getTipo() == null
                || request.getValor() == null || request.getValor().signum() < 0) {
            throw ApiException.badRequest("Nombre, tipo (porcentaje/monto) y valor son requeridos");
        }
        if (request.getTipo() == TipoDescuento.porcentaje && request.getValor().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw ApiException.badRequest("Un descuento por porcentaje no puede superar 100");
        }
        Descuento descuento = Descuento.builder()
                .nombre(request.getNombre().trim())
                .tipo(request.getTipo())
                .valor(request.getValor())
                .activo(true)
                .build();
        descuento = descuentoRepository.save(descuento);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.CREAR, "Descuento",
                descuento.getId(), "Descuento creado: " + descuento.getNombre());

        return descuento;
    }

    @Override
    @Transactional
    public Descuento actualizar(Long id, DescuentoRequest request, AuthenticatedUser usuario) {
        Descuento descuento = descuentoRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Descuento no encontrado"));
        if (request.getValor() != null && request.getValor().signum() < 0) {
            throw ApiException.badRequest("El valor no puede ser negativo");
        }
        if (request.getNombre() != null) descuento.setNombre(request.getNombre().trim());
        if (request.getTipo() != null) descuento.setTipo(request.getTipo());
        if (request.getValor() != null) descuento.setValor(request.getValor());
        if (request.getActivo() != null) descuento.setActivo(request.getActivo());
        descuento = descuentoRepository.save(descuento);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ACTUALIZAR, "Descuento",
                descuento.getId(), "Descuento actualizado: " + descuento.getNombre());

        return descuento;
    }

    @Override
    @Transactional
    public void eliminar(Long id, AuthenticatedUser usuario) {
        Descuento descuento = descuentoRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Descuento no encontrado"));
        descuento.setActivo(false);
        descuentoRepository.save(descuento);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ELIMINAR, "Descuento", id,
                "Descuento desactivado: " + descuento.getNombre());
    }
}
