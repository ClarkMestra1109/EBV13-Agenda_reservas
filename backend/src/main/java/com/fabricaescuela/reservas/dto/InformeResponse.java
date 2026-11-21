package com.fabricaescuela.reservas.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * HU20-HU23: informe del proveedor para un periodo (fechas inclusivas) y, opcionalmente, un
 * servicio. Una reserva pertenece al periodo según la fecha de la cita.
 */
public record InformeResponse(
        LocalDate desde,
        LocalDate hasta,
        Long servicioId,
        String servicio,
        Resumen resumen,
        List<PorServicio> porServicio,
        List<Detalle> reservas
) {
    /**
     * @param reservas            HU20: reservas confirmadas (vigentes o ya atendidas) del periodo.
     * @param canceladas          reservas del periodo que el cliente canceló.
     * @param cuposPublicados     HU21: capacidad total publicada en el periodo.
     * @param cuposReservados     cupos de esa capacidad que fueron reservados.
     * @param cuposDisponibles    cupos que quedaron libres.
     * @param porcentajeOcupacion reservados / publicados × 100; null si no hubo disponibilidad.
     * @param ingresosEstimados   suma del precio de las reservas confirmadas.
     */
    public record Resumen(
            long reservas,
            long canceladas,
            long cuposPublicados,
            long cuposReservados,
            long cuposDisponibles,
            Double porcentajeOcupacion,
            BigDecimal ingresosEstimados
    ) {
    }

    public record PorServicio(
            Long servicioId,
            String servicio,
            long reservas,
            long canceladas,
            long cuposPublicados,
            long cuposReservados,
            Double porcentajeOcupacion
    ) {
    }

    public record Detalle(
            Long reservaId,
            Instant inicio,
            Instant fin,
            Long servicioId,
            String servicio,
            String cliente,
            String estado,
            BigDecimal precio
    ) {
    }
}
