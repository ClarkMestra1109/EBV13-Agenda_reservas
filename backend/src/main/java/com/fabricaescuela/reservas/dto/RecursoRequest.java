package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.TipoRecurso;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** HU07/HU09: datos para registrar o actualizar un recurso. */
public record RecursoRequest(
        @NotBlank(message = "El nombre del recurso es obligatorio")
        @Size(min = 2, max = 100, message = "El nombre del recurso debe tener entre 2 y 100 caracteres")
        @Pattern(regexp = "^$|^(?s)(?=.*[\\p{L}\\d]).*$",
                message = "El nombre del recurso debe incluir letras o números")
        String nombre,

        @NotNull(message = "El tipo de recurso es obligatorio")
        TipoRecurso tipo,

        @Size(max = 255, message = "La descripción no puede superar 255 caracteres")
        String descripcion,

        @NotNull(message = "La capacidad es obligatoria")
        @Min(value = 1, message = "La capacidad debe ser al menos 1")
        @Max(value = 1000, message = "La capacidad no puede superar 1000")
        Integer capacidad
) {
}
