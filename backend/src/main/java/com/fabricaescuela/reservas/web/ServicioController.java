package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.ServicioRequest;
import com.fabricaescuela.reservas.dto.ServicioResponse;
import com.fabricaescuela.reservas.security.UsuarioAutenticado;
import com.fabricaescuela.reservas.service.ServicioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/servicios")
@PreAuthorize("hasRole('PROVEEDOR')")
public class ServicioController {

    private final ServicioService servicios;

    public ServicioController(ServicioService servicios) {
        this.servicios = servicios;
    }

    @PostMapping
    public ResponseEntity<ServicioResponse> crear(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                                  @Valid @RequestBody ServicioRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(servicios.crear(usuario.id(), req));
    }

    @GetMapping("/mis-servicios")
    public List<ServicioResponse> misServicios(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return servicios.listarPropios(usuario.id());
    }

    @PutMapping("/{id}")
    public ServicioResponse actualizar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                       @PathVariable Long id,
                                       @Valid @RequestBody ServicioRequest req) {
        return servicios.actualizar(usuario.id(), id, req);
    }

    /** HU06: baja lógica de un servicio propio. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                         @PathVariable Long id) {
        servicios.eliminar(usuario.id(), id);
        return ResponseEntity.noContent().build();
    }
}
