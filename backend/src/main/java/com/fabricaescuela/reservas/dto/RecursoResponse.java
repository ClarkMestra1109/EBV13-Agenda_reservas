package com.fabricaescuela.reservas.dto;

import java.util.List;

/**
 * HU07-HU09: recurso con sus servicios asociados y su ocupación próxima.
 *
 * @param reservasProximas  reservas confirmadas futuras que usan el recurso.
 * @param ocupacionMaxima   mayor cantidad de esas reservas que coinciden al mismo tiempo.
 * @param cuposLibresEnPico capacidad menos la ocupación máxima: cupos que quedan en el
 *                          momento más ocupado.
 */
public record RecursoResponse(
        Long id,
        String nombre,
        String tipo,
        String descripcion,
        Integer capacidad,
        List<ServicioAsociado> servicios,
        Integer reservasProximas,
        Integer ocupacionMaxima,
        Integer cuposLibresEnPico
) {
    public record ServicioAsociado(Long id, String nombre, String estado) {
    }
}
