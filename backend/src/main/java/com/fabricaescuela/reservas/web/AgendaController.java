package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.ReservaResponse;
import com.fabricaescuela.reservas.security.UsuarioAutenticado;
import com.fabricaescuela.reservas.service.ReservaService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** HU17: agenda según el rol del usuario autenticado. */
@RestController
@RequestMapping("/api/agenda")
public class AgendaController {

    private final ReservaService reservas;

    public AgendaController(ReservaService reservas) {
        this.reservas = reservas;
    }

    @GetMapping
    public List<ReservaResponse> miAgenda(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return reservas.agenda(usuario);
    }
}
