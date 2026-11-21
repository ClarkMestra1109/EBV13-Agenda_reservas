package com.fabricaescuela.reservas.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Verificación de que el servidor está en línea. Es pública y no consulta la base de datos,
 * así que sirve para "despertar" el backend (el frontend la llama al abrir la página) y para
 * un monitor externo que lo mantenga activo, sin gastar recursos de la base de datos.
 */
@RestController
public class SaludController {

    @GetMapping("/api/salud")
    public Map<String, Object> salud() {
        return Map.of("estado", "ok", "hora", Instant.now().toString());
    }
}
