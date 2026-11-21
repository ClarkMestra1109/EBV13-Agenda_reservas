package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.InformeResponse;
import com.fabricaescuela.reservas.security.UsuarioAutenticado;
import com.fabricaescuela.reservas.service.InformeService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** HU20-HU23: módulo de informes del proveedor. */
@RestController
@RequestMapping("/api/informes")
@PreAuthorize("hasRole('PROVEEDOR')")
public class InformeController {

    private final InformeService informes;

    public InformeController(InformeService informes) {
        this.informes = informes;
    }

    /** Ej.: GET /api/informes?desde=2026-11-01&hasta=2026-11-30&servicioId=3 */
    @GetMapping
    public InformeResponse generar(
            @AuthenticationPrincipal UsuarioAutenticado usuario,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Long servicioId) {
        return informes.generar(usuario.id(), desde, hasta, servicioId);
    }
}
