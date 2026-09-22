package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotNull;

public record ReservaRequest(
        @NotNull(message = "La franja es obligatoria")
        Long franjaId
) {
}
