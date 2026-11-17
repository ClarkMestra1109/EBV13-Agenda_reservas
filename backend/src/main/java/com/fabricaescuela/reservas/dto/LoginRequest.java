package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Size(max = 150, message = "El correo no puede superar 150 caracteres")
        String correo,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(max = 200, message = "La contraseña no puede superar 200 caracteres")
        String contrasena
) {
}
