package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.EstadoServicio;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ServicioRequest(
        @NotBlank(message = "El nombre del servicio es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String nombre,

        @NotBlank(message = "La descripción es obligatoria")
        @Size(max = 255, message = "La descripción no puede superar 255 caracteres")
        String descripcion,

        @NotNull(message = "La duración es obligatoria")
        @Min(value = 5, message = "La duración debe ser un número entero de minutos entre 5 y 480")
        @Max(value = 480, message = "La duración debe ser un número entero de minutos entre 5 y 480")
        Integer duracionMin,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor que 0")
        @Digits(integer = 10, fraction = 2, message = "El precio admite hasta 2 decimales")
        BigDecimal precio,

        // Opcional: permite activar o desactivar el servicio al actualizarlo (HU06).
        EstadoServicio estado
) {
}
