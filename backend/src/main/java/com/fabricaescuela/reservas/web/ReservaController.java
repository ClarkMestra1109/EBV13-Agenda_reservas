package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.ReprogramarReservaRequest;
import com.fabricaescuela.reservas.dto.ReservaRequest;
import com.fabricaescuela.reservas.dto.ReservaResponse;
import com.fabricaescuela.reservas.security.UsuarioAutenticado;
import com.fabricaescuela.reservas.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Reservas del cliente (HU14, HU15 y HU16). El acceso solo para CLIENTE se define en SecurityConfig. */
@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservas;

    public ReservaController(ReservaService reservas) {
        this.reservas = reservas;
    }

    @PostMapping
    public ResponseEntity<ReservaResponse> confirmar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                                     @Valid @RequestBody ReservaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservas.confirmar(usuario.id(), req.franjaId()));
    }

    @PutMapping("/{id}/cancelar")
    public ReservaResponse cancelar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                    @PathVariable Long id) {
        return reservas.cancelar(usuario.id(), id);
    }

    /** HU16: cambia la reserva a una nueva franja del mismo servicio. */
    @PutMapping("/{id}/reprogramar")
    public ReservaResponse reprogramar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                       @PathVariable Long id,
                                       @Valid @RequestBody ReprogramarReservaRequest req) {
        return reservas.reprogramar(usuario.id(), id, req.nuevaFranjaId());
    }
}
