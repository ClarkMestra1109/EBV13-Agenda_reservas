package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

/** Fechas en formato ISO-8601 con zona, p. ej. 2026-10-05T09:00:00-05:00. */
public record FranjaRequest(
        @NotNull(message = "La hora de inicio es obligatoria")
        OffsetDateTime inicio,

        @NotNull(message = "La hora de fin es obligatoria")
        OffsetDateTime fin,

        // Opcional: si no se envía la franja tiene 1 cupo.
        @Min(value = 1, message = "El cupo debe ser de al menos 1")
        @Max(value = 100, message = "El cupo no puede superar 100")
        Integer cupoTotal
) {
}
