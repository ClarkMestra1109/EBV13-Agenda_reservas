package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Cambio de contraseña desde el perfil, conociendo la contraseña actual. */
public record CambiarContrasenaRequest(
        @NotBlank(message = "La contraseña actual es obligatoria")
        @Size(max = 200, message = "La contraseña actual no es válida")
        String contrasenaActual,

        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                message = "La contraseña debe tener entre 8 y 72 caracteres, con letras y números")
        String nuevaContrasena,

        @NotBlank(message = "Debe confirmar la nueva contraseña")
        String confirmarContrasena
) {
}
