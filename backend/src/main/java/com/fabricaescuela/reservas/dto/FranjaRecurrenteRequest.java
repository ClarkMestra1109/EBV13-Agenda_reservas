package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

/**
 * HU12: patrón semanal para publicar varias franjas de una sola vez.
 * Ej.: todos los lunes y miércoles de 9:00 a 10:00, hasta el 30 de noviembre.
 */
public record FranjaRecurrenteRequest(
        @NotNull(message = "La hora de inicio es obligatoria")
        LocalTime horaInicio,

        @NotNull(message = "La hora de fin es obligatoria")
        LocalTime horaFin,

        @NotEmpty(message = "Debe seleccionar al menos un día de la semana")
        Set<DayOfWeek> diasSemana,

        @NotNull(message = "La fecha límite de repetición es obligatoria")
        @Future(message = "La fecha límite de repetición debe ser futura")
        LocalDate repetirHasta,

        @Min(value = 1, message = "El cupo debe ser de al menos 1")
        @Max(value = 100, message = "El cupo no puede superar 100")
        Integer cupoTotal
) {
}
