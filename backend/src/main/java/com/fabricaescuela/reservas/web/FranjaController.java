package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.FranjaRecurrenteRequest;
import com.fabricaescuela.reservas.dto.FranjaRequest;
import com.fabricaescuela.reservas.dto.FranjaResponse;
import com.fabricaescuela.reservas.security.UsuarioAutenticado;
import com.fabricaescuela.reservas.service.FranjaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Disponibilidad del proveedor (HU10 y HU11). El acceso solo para PROVEEDOR se define en SecurityConfig. */
@RestController
public class FranjaController {

    private final FranjaService franjas;

    public FranjaController(FranjaService franjas) {
        this.franjas = franjas;
    }

    @PostMapping("/api/servicios/{servicioId}/franjas")
    public ResponseEntity<FranjaResponse> publicar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                                   @PathVariable Long servicioId,
                                                   @Valid @RequestBody FranjaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(franjas.publicar(usuario.id(), servicioId, req));
    }

    /** HU12: publica varias franjas siguiendo un patrón semanal. */
    @PostMapping("/api/servicios/{servicioId}/franjas/recurrentes")
    public ResponseEntity<List<FranjaResponse>> publicarRecurrente(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                                                    @PathVariable Long servicioId,
                                                                    @Valid @RequestBody FranjaRecurrenteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(franjas.publicarRecurrente(usuario.id(), servicioId, req));
    }

    @GetMapping("/api/servicios/{servicioId}/franjas")
    public List<FranjaResponse> listar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                       @PathVariable Long servicioId) {
        return franjas.listarDeServicioPropio(usuario.id(), servicioId);
    }

    @DeleteMapping("/api/franjas/{id}")
    public FranjaResponse retirar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                  @PathVariable Long id) {
        return franjas.retirar(usuario.id(), id);
    }
}
