package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.Servicio;
import com.fabricaescuela.reservas.domain.Usuario;

import java.math.BigDecimal;

/** Servicio tal como lo ve un cliente que busca dónde reservar, con los datos del negocio. */
public record CatalogoServicioResponse(
        Long id,
        String nombre,
        String descripcion,
        Integer duracionMin,
        BigDecimal precio,
        String proveedorNombre,
        String modalidad,
        String ubicacion,
        Long imagenVersion,
        String nombreComercial,
        String sectorActividad,
        String descripcionComercial,
        String sitioWeb
) {

    public static CatalogoServicioResponse desde(Servicio s) {
        Usuario p = s.getProveedor();
        return new CatalogoServicioResponse(
                s.getId(), s.getNombre(), s.getDescripcion(), s.getDuracionMin(),
                s.getPrecio(), p.getNombre(), s.getModalidad().name(), s.getUbicacion(),
                s.getImagenActualizada() == null ? null : s.getImagenActualizada().toEpochMilli(),
                p.getNombreComercial(), p.getSectorActividad(), p.getDescripcionComercial(), p.getSitioWeb());
    }
}
