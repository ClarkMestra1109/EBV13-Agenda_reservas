package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.Servicio;

import java.math.BigDecimal;
import java.time.Instant;

public record ServicioResponse(
        Long id,
        String nombre,
        String descripcion,
        Integer duracionMin,
        BigDecimal precio,
        String estado,
        Instant fechaCreacion
) {

    public static ServicioResponse desde(Servicio s) {
        return new ServicioResponse(
                s.getId(),
                s.getNombre(),
                s.getDescripcion(),
                s.getDuracionMin(),
                s.getPrecio(),
                s.getEstado().name(),
                s.getFechaCreacion());
    }
}
