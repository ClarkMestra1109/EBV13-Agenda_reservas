package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.EstadoFranja;
import com.fabricaescuela.reservas.domain.EstadoServicio;
import com.fabricaescuela.reservas.domain.Franja;
import com.fabricaescuela.reservas.domain.Servicio;
import com.fabricaescuela.reservas.dto.FranjaRequest;
import com.fabricaescuela.reservas.dto.FranjaResponse;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.FranjaRepository;
import com.fabricaescuela.reservas.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class FranjaService {

    private static final int CUPO_POR_DEFECTO = 1;

    private final FranjaRepository franjas;
    private final ServicioRepository servicios;

    public FranjaService(FranjaRepository franjas, ServicioRepository servicios) {
        this.franjas = franjas;
        this.servicios = servicios;
    }

    /** HU10: el proveedor publica una franja futura y válida para uno de sus servicios. */
    @Transactional
    public FranjaResponse publicar(Long proveedorId, Long servicioId, FranjaRequest req) {
        Servicio servicio = servicioPropio(proveedorId, servicioId);
        if (servicio.getEstado() != EstadoServicio.ACTIVO) {
            throw ApiException.conflicto("El servicio no está activo");
        }
        Instant inicio = req.inicio().toInstant();
        Instant fin = req.fin().toInstant();
        if (!fin.isAfter(inicio)) {
            throw ApiException.invalido("El rango de la franja no es válido: el fin debe ser posterior al inicio");
        }
        if (!inicio.isAfter(Instant.now())) {
            throw ApiException.invalido("La franja debe ser futura");
        }
        Franja franja = new Franja();
        franja.setServicio(servicio);
        franja.setInicio(inicio);
        franja.setFin(fin);
        franja.setCupoTotal(req.cupoTotal() != null ? req.cupoTotal() : CUPO_POR_DEFECTO);
        franja.setCuposOcupados(0);
        franja.setEstado(EstadoFranja.PUBLICADA);
        return FranjaResponse.desde(franjas.saveAndFlush(franja));
    }

    /** Todas las franjas de un servicio propio (incluye retiradas y llenas). */
    @Transactional(readOnly = true)
    public List<FranjaResponse> listarDeServicioPropio(Long proveedorId, Long servicioId) {
        servicioPropio(proveedorId, servicioId);
        return franjas.findByServicioIdOrderByInicioAsc(servicioId).stream()
                .map(FranjaResponse::desde)
                .toList();
    }

    /** HU11: solo se retira una franja futura y sin reservas; si tiene reservas se protege. */
    @Transactional
    public FranjaResponse retirar(Long proveedorId, Long franjaId) {
        Franja franja = franjas.buscarParaActualizar(franjaId)
                .orElseThrow(() -> ApiException.noEncontrado("La franja no existe"));
        if (!franja.getServicio().getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso sobre esta franja");
        }
        if (franja.getEstado() == EstadoFranja.RETIRADA) {
            throw ApiException.conflicto("La franja ya fue retirada");
        }
        if (!franja.getInicio().isAfter(Instant.now())) {
            throw ApiException.conflicto("Solo se pueden retirar franjas futuras");
        }
        if (franja.getCuposOcupados() > 0) {
            throw ApiException.conflicto("La franja tiene reservas y no puede retirarse");
        }
        franja.setEstado(EstadoFranja.RETIRADA);
        return FranjaResponse.desde(franjas.saveAndFlush(franja));
    }

    /** Franjas que un cliente puede reservar de un servicio activo. */
    @Transactional(readOnly = true)
    public List<FranjaResponse> disponiblesDe(Long servicioId) {
        Servicio servicio = servicios.findById(servicioId)
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
        if (servicio.getEstado() != EstadoServicio.ACTIVO) {
            return List.of();
        }
        return franjas.disponibles(servicioId, EstadoFranja.PUBLICADA, Instant.now()).stream()
                .map(FranjaResponse::desde)
                .toList();
    }

    private Servicio servicioPropio(Long proveedorId, Long servicioId) {
        Servicio servicio = servicios.findById(servicioId)
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
        if (!servicio.getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso sobre este servicio");
        }
        return servicio;
    }
}
