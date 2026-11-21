package com.fabricaescuela.reservas.dto;

import com.fabricaescuela.reservas.domain.Rol;
import com.fabricaescuela.reservas.domain.Usuario;

/** Perfil del usuario. Los campos comerciales solo vienen con valor para proveedores. */
public record UsuarioResponse(
        Long id,
        String nombre,
        String correo,
        String telefono,
        Rol rol,
        String nombreComercial,
        String sectorActividad,
        String descripcionComercial,
        String sitioWeb
) {

    public static UsuarioResponse desde(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNombre(), u.getCorreo(), u.getTelefono(), u.getRol(),
                u.getNombreComercial(), u.getSectorActividad(), u.getDescripcionComercial(), u.getSitioWeb());
    }
}
