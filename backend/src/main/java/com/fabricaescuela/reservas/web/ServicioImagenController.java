package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.ImagenRequest;
import com.fabricaescuela.reservas.dto.ServicioResponse;
import com.fabricaescuela.reservas.security.UsuarioAutenticado;
import com.fabricaescuela.reservas.service.ServicioImagenService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/** Foto de los servicios: el proveedor la carga o la quita; cualquiera puede verla. */
@RestController
public class ServicioImagenController {

    private final ServicioImagenService imagenes;

    public ServicioImagenController(ServicioImagenService imagenes) {
        this.imagenes = imagenes;
    }

    @PutMapping("/api/servicios/{id}/imagen")
    @PreAuthorize("hasRole('PROVEEDOR')")
    public ServicioResponse guardar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                    @PathVariable Long id,
                                    @Valid @RequestBody ImagenRequest req) {
        return imagenes.guardar(usuario.id(), id, req.imagen());
    }

    @DeleteMapping("/api/servicios/{id}/imagen")
    @PreAuthorize("hasRole('PROVEEDOR')")
    public ServicioResponse eliminar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                     @PathVariable Long id) {
        return imagenes.eliminar(usuario.id(), id);
    }

    /**
     * Pública porque una etiqueta {@code <img>} no envía el token. La URL lleva la versión
     * (?v=...), así que el navegador puede guardarla en caché mucho tiempo: al cambiar la
     * foto cambia la URL.
     */
    @GetMapping("/api/imagenes/servicios/{id}")
    public ResponseEntity<byte[]> ver(@PathVariable Long id) {
        ServicioImagenService.Archivo archivo = imagenes.obtener(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(archivo.tipo()))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .header("X-Content-Type-Options", "nosniff")
                .body(archivo.contenido());
    }
}
