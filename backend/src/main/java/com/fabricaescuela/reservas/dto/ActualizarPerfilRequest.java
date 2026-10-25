package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** HU03: datos básicos que un usuario puede editar de su propio perfil. */
public record ActualizarPerfilRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String nombre,

        @NotBlank(message = "El correo electrónico es obligatorio")
        @Pattern(regexp = "^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$",
                message = "Debe ingresar un correo electrónico válido")
        @Size(max = 150, message = "El correo no puede superar 150 caracteres")
        String correo,

        // Opcional: el teléfono no es un campo obligatorio en el registro original.
        @Size(max = 20, message = "El teléfono no puede superar 20 caracteres")
        String telefono
) {
}
