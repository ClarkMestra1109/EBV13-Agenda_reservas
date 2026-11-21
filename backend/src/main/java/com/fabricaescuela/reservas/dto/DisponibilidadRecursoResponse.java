package com.fabricaescuela.reservas.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** HU09: cuántos cupos le quedan al recurso en cada horario publicado de un día. */
public record DisponibilidadRecursoResponse(
        Long recursoId,
        String recurso,
        Integer capacidad,
        LocalDate fecha,
        List<Horario> horarios
) {
    public record Horario(
            Long franjaId,
            Long servicioId,
            String servicio,
            Instant inicio,
            Instant fin,
            Integer reservasSimultaneas,
            Integer cuposDisponibles
    ) {
    }
}
