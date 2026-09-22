package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.Franja;

import java.time.Instant;

public record FranjaResponse(
        Long id,
        Long servicioId,
        Instant inicio,
        Instant fin,
        Integer cupoTotal,
        Integer cuposOcupados,
        Integer cuposDisponibles,
        String estado
) {

    public static FranjaResponse desde(Franja f) {
        return new FranjaResponse(
                f.getId(),
                f.getServicio().getId(),
                f.getInicio(),
                f.getFin(),
                f.getCupoTotal(),
                f.getCuposOcupados(),
                f.cuposDisponibles(),
                f.getEstado().name());
    }
}
