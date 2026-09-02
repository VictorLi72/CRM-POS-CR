package com.crmsuper.pos.service.impl;

import com.crmsuper.pos.dto.TarifaIvaRequest;
import com.crmsuper.pos.exception.ApiException;
import com.crmsuper.pos.model.TarifaIva;
import com.crmsuper.pos.model.enums.TipoAccion;
import com.crmsuper.pos.repository.TarifaIvaRepository;
import com.crmsuper.pos.security.AuthenticatedUser;
import com.crmsuper.pos.service.AuditoriaService;
import com.crmsuper.pos.service.TaxRateService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TaxRateServiceImpl implements TaxRateService {

    private final TarifaIvaRepository tarifaIvaRepository;
    private final AuditoriaService auditoriaService;

    public TaxRateServiceImpl(TarifaIvaRepository tarifaIvaRepository, AuditoriaService auditoriaService) {
        this.tarifaIvaRepository = tarifaIvaRepository;
        this.auditoriaService = auditoriaService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TarifaIva> listar(boolean todas) {
        return todas ? tarifaIvaRepository.findAllByOrderByPorcentajeAsc()
                : tarifaIvaRepository.findAllByActivoTrueOrderByPorcentajeAsc();
    }

    @Override
    @Transactional
    public TarifaIva crear(TarifaIvaRequest request, AuthenticatedUser usuario) {
        validarPorcentaje(request.getPorcentaje());
        if (tarifaIvaRepository.existsByPorcentaje(request.getPorcentaje())) {
            throw ApiException.badRequest("Ya existe una tarifa con ese porcentaje");
        }
        TarifaIva tarifa = TarifaIva.builder()
                .porcentaje(request.getPorcentaje())
                .nombre(request.getNombre())
                .activo(true)
                .build();
        tarifa = tarifaIvaRepository.save(tarifa);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.CREAR, "TarifaIva",
                tarifa.getId(), "Tarifa de IVA creada: " + tarifa.getPorcentaje() + "%");

        return tarifa;
    }

    @Override
    @Transactional
    public TarifaIva actualizar(Long id, TarifaIvaRequest request, AuthenticatedUser usuario) {
        TarifaIva tarifa = tarifaIvaRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Tarifa no encontrada"));
        if (request.getPorcentaje() != null) {
            validarPorcentaje(request.getPorcentaje());
            tarifa.setPorcentaje(request.getPorcentaje());
        }
        if (request.getNombre() != null) tarifa.setNombre(request.getNombre());
        if (request.getActivo() != null) tarifa.setActivo(request.getActivo());
        tarifa = tarifaIvaRepository.save(tarifa);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ACTUALIZAR, "TarifaIva",
                tarifa.getId(), "Tarifa de IVA actualizada: " + tarifa.getPorcentaje() + "%");

        return tarifa;
    }

    @Override
    @Transactional
    public void eliminar(Long id, AuthenticatedUser usuario) {
        TarifaIva tarifa = tarifaIvaRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Tarifa no encontrada"));
        tarifa.setActivo(false);
        tarifaIvaRepository.save(tarifa);

        auditoriaService.registrar(usuario.id(), usuario.nombreCompleto(), TipoAccion.ELIMINAR, "TarifaIva", id,
                "Tarifa de IVA desactivada: " + tarifa.getPorcentaje() + "%");
    }

    private void validarPorcentaje(BigDecimal porcentaje) {
        if (porcentaje == null || porcentaje.signum() < 0 || porcentaje.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw ApiException.badRequest("El porcentaje debe estar entre 0 y 100");
        }
    }
}
