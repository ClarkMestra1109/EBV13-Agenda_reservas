package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.EstadoServicio;
import com.fabricaescuela.reservas.domain.Modalidad;
import jakarta.validation.constraints.DecimalMax;
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
        @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres")
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
        @DecimalMax(value = "50000000", message = "El precio no puede superar 50.000.000 COP")
        @Digits(integer = 8, fraction = 2, message = "El precio admite hasta 2 decimales")
        BigDecimal precio,

        // Opcional: permite activar o desactivar el servicio al actualizarlo (HU06).
        EstadoServicio estado,

        // Opcional: si no se envía se conserva la modalidad actual (presencial por defecto).
        Modalidad modalidad,

        // Obligatoria si la modalidad es presencial; se ignora si es virtual.
        @Size(max = 200, message = "La ubicación no puede superar 200 caracteres")
        String ubicacion
) {
}
