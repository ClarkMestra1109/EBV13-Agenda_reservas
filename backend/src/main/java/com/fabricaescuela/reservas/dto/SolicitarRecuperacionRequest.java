package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotBlank;

public record SolicitarRecuperacionRequest(
        @NotBlank(message = "El correo electrónico es obligatorio")
        String correo
) {
}
