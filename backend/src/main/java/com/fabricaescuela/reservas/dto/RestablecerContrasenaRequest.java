package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RestablecerContrasenaRequest(
        @NotBlank(message = "El token es obligatorio")
        String token,

        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                message = "La contraseña debe tener entre 8 y 72 caracteres, con letras y números")
        String nuevaContrasena,

        @NotBlank(message = "Debe confirmar la nueva contraseña")
        String confirmarContrasena
) {
}
