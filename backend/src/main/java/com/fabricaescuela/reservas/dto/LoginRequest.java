package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "El correo electrónico es obligatorio")
        String correo,

        @NotBlank(message = "La contraseña es obligatoria")
        String contrasena
) {
}
