package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.Usuario;
import com.fabricaescuela.reservas.dto.AuthResponse;
import com.fabricaescuela.reservas.dto.LoginRequest;
import com.fabricaescuela.reservas.dto.RegistroRequest;
import com.fabricaescuela.reservas.dto.UsuarioResponse;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.UsuarioRepository;
import com.fabricaescuela.reservas.security.JwtService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private static final String CORREO_REGISTRADO = "El correo electrónico ya se encuentra registrado";

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder encoder, JwtService jwt) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    /** HU01: crear cuenta con nombre, correo, contraseña y rol. */
    @Transactional
    public UsuarioResponse registrar(RegistroRequest req) {
        String correo = normalizar(req.correo());
        if (usuarios.existsByCorreo(correo)) {
            throw ApiException.conflicto(CORREO_REGISTRADO);
        }
        Usuario usuario = new Usuario();
        usuario.setNombre(req.nombre().trim());
        usuario.setCorreo(correo);
        usuario.setContrasenaHash(encoder.encode(req.contrasena()));
        usuario.setRol(req.rol());
        try {
            usuarios.saveAndFlush(usuario);
        } catch (DataIntegrityViolationException e) {
            // Dos registros simultáneos con el mismo correo: gana la restricción única de la BD.
            throw ApiException.conflicto(CORREO_REGISTRADO);
        }
        return UsuarioResponse.desde(usuario);
    }

    /** HU02: iniciar sesión. El mensaje es el mismo si falla el correo o la contraseña. */
    @Transactional(readOnly = true)
    public AuthResponse iniciarSesion(LoginRequest req) {
        Usuario usuario = usuarios.findByCorreo(normalizar(req.correo()))
                .filter(u -> encoder.matches(req.contrasena(), u.getContrasenaHash()))
                .orElseThrow(() -> ApiException.noAutenticado("Credenciales incorrectas"));
        return new AuthResponse(jwt.generar(usuario), UsuarioResponse.desde(usuario));
    }

    private String normalizar(String correo) {
        return correo.trim().toLowerCase(Locale.ROOT);
    }
}
