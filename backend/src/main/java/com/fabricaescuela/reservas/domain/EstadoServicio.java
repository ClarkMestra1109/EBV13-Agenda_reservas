package com.fabricaescuela.reservas.domain;

public enum EstadoServicio {
    ACTIVO,
    INACTIVO,
    /** HU06: baja lógica. El servicio deja de ser editable y no aparece en el catálogo. */
    ELIMINADO
}
