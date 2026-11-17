package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** HU03: datos básicos que un usuario puede editar de su propio perfil. */
public record ActualizarPerfilRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        @Pattern(regexp = "^$|^(?=.*\\p{L}).{2,}$",
                message = "El nombre debe tener al menos 2 caracteres e incluir letras")
        String nombre,

        @NotBlank(message = "El correo electrónico es obligatorio")
        @Pattern(regexp = "^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$",
                message = "Debe ingresar un correo electrónico válido")
        @Size(max = 150, message = "El correo no puede superar 150 caracteres")
        String correo,

        // Opcional: el teléfono no es un campo obligatorio en el registro original.
        // Si se envía, solo dígitos (7 a 15) con un "+" inicial opcional para el indicativo.
        @Pattern(regexp = "^$|^\\+?[0-9]{7,15}$",
                message = "El teléfono debe tener entre 7 y 15 dígitos, sin letras ni espacios")
        String telefono
) {
}
