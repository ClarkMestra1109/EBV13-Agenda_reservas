package com.fabricaescuela.reservas.web;

import com.fabricaescuela.reservas.dto.AuthResponse;
import com.fabricaescuela.reservas.dto.LoginRequest;
import com.fabricaescuela.reservas.dto.RegistroRequest;
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
}
