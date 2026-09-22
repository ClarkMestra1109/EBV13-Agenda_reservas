package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.Reserva;

import java.math.BigDecimal;
import java.time.Instant;

/** Sirve para confirmar, cancelar y consultar la agenda (HU14, HU15 y HU17). */
public record ReservaResponse(
        Long id,
        String estado,
        Long franjaId,
        Instant inicio,
        Instant fin,
        Long servicioId,
        String servicioNombre,
        String proveedorNombre,
        String clienteNombre,
        String clienteCorreo,
        Integer duracionMin,
        BigDecimal precio
) {

    public static ReservaResponse desde(Reserva r) {
        var franja = r.getFranja();
        var servicio = franja.getServicio();
        return new ReservaResponse(
                r.getId(),
                r.getEstado().name(),
                franja.getId(),
                franja.getInicio(),
                franja.getFin(),
                servicio.getId(),
                servicio.getNombre(),
                servicio.getProveedor().getNombre(),
                r.getCliente().getNombre(),
                r.getCliente().getCorreo(),
                servicio.getDuracionMin(),
                servicio.getPrecio());
    }
}
