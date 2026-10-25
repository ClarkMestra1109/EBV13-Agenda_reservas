package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.AuthResponse;
import com.fabricaescuela.reservas.dto.LoginRequest;
import com.fabricaescuela.reservas.dto.RegistroRequest;
import com.fabricaescuela.reservas.dto.RestablecerContrasenaRequest;
import com.fabricaescuela.reservas.dto.SolicitarRecuperacionRequest;
import com.fabricaescuela.reservas.dto.UsuarioResponse;
import com.fabricaescuela.reservas.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    public ResponseEntity<UsuarioResponse> registrar(@Valid @RequestBody RegistroRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.registrar(req));
    }

    @PostMapping("/login")
    public AuthResponse iniciarSesion(@Valid @RequestBody LoginRequest req) {
        return auth.iniciarSesion(req);
    }

    /** HU04: solicita el envío del enlace de recuperación al correo registrado. */
    @PostMapping("/recuperar")
    public ResponseEntity<Void> solicitarRecuperacion(@Valid @RequestBody SolicitarRecuperacionRequest req) {
        auth.solicitarRecuperacion(req.correo());
        return ResponseEntity.ok().build();
    }

    /** HU04: usa el token recibido por correo para definir una nueva contraseña. */
    @PostMapping("/restablecer")
    public ResponseEntity<Void> restablecerContrasena(@Valid @RequestBody RestablecerContrasenaRequest req) {
        auth.restablecerContrasena(req);
        return ResponseEntity.ok().build();
    }
}
