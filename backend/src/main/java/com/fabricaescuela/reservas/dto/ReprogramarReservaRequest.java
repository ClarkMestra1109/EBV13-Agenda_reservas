package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotNull;

public record ReprogramarReservaRequest(
        @NotNull(message = "La nueva franja es obligatoria")
        Long nuevaFranjaId
) {
}
