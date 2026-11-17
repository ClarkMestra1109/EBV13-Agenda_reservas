package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SolicitarRecuperacionRequest(
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Size(max = 150, message = "El correo no puede superar 150 caracteres")
        String correo
) {
}
