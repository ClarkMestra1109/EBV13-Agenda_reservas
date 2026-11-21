package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.Servicio;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Servicio del proveedor. {@code imagenVersion} es nulo si no tiene foto; si tiene, la foto
 * se obtiene en /api/imagenes/servicios/{id}?v={imagenVersion}.
 */
public record ServicioResponse(
        Long id,
        String nombre,
        String descripcion,
        Integer duracionMin,
        BigDecimal precio,
        String estado,
        Instant fechaCreacion,
        String modalidad,
        String ubicacion,
        Long imagenVersion
) {

    public static ServicioResponse desde(Servicio s) {
        return new ServicioResponse(
                s.getId(),
                s.getNombre(),
                s.getDescripcion(),
                s.getDuracionMin(),
                s.getPrecio(),
                s.getEstado().name(),
                s.getFechaCreacion(),
                s.getModalidad().name(),
                s.getUbicacion(),
                s.getImagenActualizada() == null ? null : s.getImagenActualizada().toEpochMilli());
    }
}
