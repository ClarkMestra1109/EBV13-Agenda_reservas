package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.ReservaResponse;
import com.fabricaescuela.reservas.security.UsuarioAutenticado;
import com.fabricaescuela.reservas.service.ReservaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** HU17: agenda según el rol del usuario autenticado. HU18: con filtros opcionales. */
@RestController
@RequestMapping("/api/agenda")
public class AgendaController {

    private final ReservaService reservas;

    public AgendaController(ReservaService reservas) {
        this.reservas = reservas;
    }

    /**
     * Sin parámetros devuelve toda la agenda vigente (HU17). Con {@code fecha} y/o
     * {@code servicioId} filtra el resultado (HU18); si no hay coincidencias, la lista
     * simplemente viene vacía.
     */
    @GetMapping
    public List<ReservaResponse> miAgenda(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
                                          @RequestParam(required = false) Long servicioId) {
        if (fecha == null && servicioId == null) {
            return reservas.agenda(usuario);
        }
        return reservas.agenda(usuario, fecha, servicioId);
    }
}
