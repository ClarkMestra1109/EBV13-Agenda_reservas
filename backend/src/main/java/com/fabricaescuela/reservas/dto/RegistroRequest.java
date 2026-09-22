package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.Rol;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegistroRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String nombre,

        @NotBlank(message = "El correo electrónico es obligatorio")
        @Pattern(regexp = "^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$",
                message = "Debe ingresar un correo electrónico válido")
        @Size(max = 150, message = "El correo no puede superar 150 caracteres")
        String correo,

        @NotBlank(message = "La contraseña es obligatoria")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
                message = "La contraseña debe tener al menos 8 caracteres, con letras y números")
        String contrasena,

        @NotNull(message = "El rol es obligatorio")
        Rol rol
) {
}
