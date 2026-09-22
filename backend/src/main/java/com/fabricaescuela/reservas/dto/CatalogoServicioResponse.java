package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.Servicio;

import java.math.BigDecimal;

/** Servicio tal como lo ve un cliente que busca dónde reservar. */
public record CatalogoServicioResponse(
        Long id,
        String nombre,
        String descripcion,
        Integer duracionMin,
        BigDecimal precio,
        String proveedorNombre
) {

    public static CatalogoServicioResponse desde(Servicio s) {
        return new CatalogoServicioResponse(
                s.getId(), s.getNombre(), s.getDescripcion(), s.getDuracionMin(),
                s.getPrecio(), s.getProveedor().getNombre());
    }
}
