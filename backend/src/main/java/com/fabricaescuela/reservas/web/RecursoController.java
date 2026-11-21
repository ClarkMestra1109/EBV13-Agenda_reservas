package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.DisponibilidadRecursoResponse;
import com.fabricaescuela.reservas.dto.RecursoRequest;
import com.fabricaescuela.reservas.dto.RecursoResponse;
import com.fabricaescuela.reservas.security.UsuarioAutenticado;
import com.fabricaescuela.reservas.service.RecursoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** HU07, HU08 y HU09: recursos del proveedor, su capacidad y su asociación con servicios. */
@RestController
@PreAuthorize("hasRole('PROVEEDOR')")
public class RecursoController {

    private final RecursoService recursos;

    public RecursoController(RecursoService recursos) {
        this.recursos = recursos;
    }

    @PostMapping("/api/recursos")
    public ResponseEntity<RecursoResponse> crear(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                                 @Valid @RequestBody RecursoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recursos.crear(usuario.id(), req));
    }

    @GetMapping("/api/recursos")
    public List<RecursoResponse> listar(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return recursos.listarPropios(usuario.id());
    }

    @PutMapping("/api/recursos/{id}")
    public RecursoResponse actualizar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                      @PathVariable Long id,
                                      @Valid @RequestBody RecursoRequest req) {
        return recursos.actualizar(usuario.id(), id, req);
    }

    @DeleteMapping("/api/recursos/{id}")
    public ResponseEntity<Void> eliminar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                         @PathVariable Long id) {
        recursos.eliminar(usuario.id(), id);
        return ResponseEntity.noContent().build();
    }

    /** Ocupación del recurso en los horarios de un día (por defecto, hoy). */
    @GetMapping("/api/recursos/{id}/disponibilidad")
    public DisponibilidadRecursoResponse disponibilidad(
            @AuthenticationPrincipal UsuarioAutenticado usuario,
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return recursos.disponibilidad(usuario.id(), id, fecha);
    }

    @GetMapping("/api/servicios/{servicioId}/recursos")
    public List<RecursoResponse> deServicio(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                            @PathVariable Long servicioId) {
        return recursos.recursosDeServicio(usuario.id(), servicioId);
    }

    @PostMapping("/api/servicios/{servicioId}/recursos/{recursoId}")
    public ResponseEntity<RecursoResponse> asociar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                                   @PathVariable Long servicioId,
                                                   @PathVariable Long recursoId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recursos.asociar(usuario.id(), servicioId, recursoId));
    }

    @DeleteMapping("/api/servicios/{servicioId}/recursos/{recursoId}")
    public ResponseEntity<Void> desasociar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                           @PathVariable Long servicioId,
                                           @PathVariable Long recursoId) {
        recursos.desasociar(usuario.id(), servicioId, recursoId);
        return ResponseEntity.noContent().build();
    }
}
