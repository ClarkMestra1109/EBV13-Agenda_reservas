package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.CatalogoServicioResponse;
import com.fabricaescuela.reservas.dto.FranjaResponse;
import com.fabricaescuela.reservas.service.FranjaService;
import com.fabricaescuela.reservas.service.ServicioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Lo que un usuario autenticado puede consultar para decidir qué reservar. */
@RestController
@RequestMapping("/api/catalogo")
public class CatalogoController {

    private final ServicioService servicios;
    private final FranjaService franjas;

    public CatalogoController(ServicioService servicios, FranjaService franjas) {
        this.servicios = servicios;
        this.franjas = franjas;
    }

    @GetMapping("/servicios")
    public List<CatalogoServicioResponse> servicios() {
        return servicios.catalogo();
    }

    @GetMapping("/servicios/{servicioId}/franjas")
    public List<FranjaResponse> franjasDisponibles(@PathVariable Long servicioId) {
        return franjas.disponiblesDe(servicioId);
    }
}
