package com.fabricaescuela.reservas.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Foto de un servicio. Va en una tabla aparte para no cargar la imagen cada vez que se lee
 * un servicio, y en la base de datos porque el disco del servidor (Render) se borra en cada
 * despliegue o reinicio.
 */
@Entity
@Table(name = "servicio_imagen")
public class ServicioImagen {

    @Id
    @Column(name = "id_servicio")
    private Long servicioId;

    /** Tipo MIME: image/jpeg, image/png o image/webp. */
    @Column(nullable = false, length = 20)
    private String tipo;

    /** Contenido de la imagen codificado en Base64. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String datosBase64;

    @Column(nullable = false)
    private Instant actualizada;

    protected ServicioImagen() {
    }

    public ServicioImagen(Long servicioId) {
        this.servicioId = servicioId;
    }

    public Long getServicioId() { return servicioId; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getDatosBase64() { return datosBase64; }
    public void setDatosBase64(String datosBase64) { this.datosBase64 = datosBase64; }
    public Instant getActualizada() { return actualizada; }
    public void setActualizada(Instant actualizada) { this.actualizada = actualizada; }
}
