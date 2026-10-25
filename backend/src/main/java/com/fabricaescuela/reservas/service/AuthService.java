package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.TokenRecuperacion;
import com.fabricaescuela.reservas.domain.Usuario;
import com.fabricaescuela.reservas.dto.AuthResponse;
import com.fabricaescuela.reservas.dto.LoginRequest;
import com.fabricaescuela.reservas.dto.RegistroRequest;
import com.fabricaescuela.reservas.dto.RestablecerContrasenaRequest;
import com.fabricaescuela.reservas.dto.UsuarioResponse;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.TokenRecuperacionRepository;
import com.fabricaescuela.reservas.repository.UsuarioRepository;
import com.fabricaescuela.reservas.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private static final String CORREO_REGISTRADO = "El correo electrónico ya se encuentra registrado";
    private static final long EXPIRACION_RECUPERACION_MINUTOS = 30;

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final TokenRecuperacionRepository tokens;
    private final EmailService emailService;
    private final String urlFrontend;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder encoder, JwtService jwt,
                       TokenRecuperacionRepository tokens, EmailService emailService,
                       @Value("${app.frontend.url}") String urlFrontend) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.jwt = jwt;
        this.tokens = tokens;
        this.emailService = emailService;
        this.urlFrontend = urlFrontend;
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

    /**
     * HU04: genera un token de un solo uso y "envía" el enlace de recuperación al correo.
     * Si el correo no está registrado, se informa explícitamente (así lo pide el criterio de
     * aceptación de esta HU), a diferencia de HU02 donde por seguridad no se distingue el motivo.
     */
    @Transactional
    public void solicitarRecuperacion(String correo) {
        Usuario usuario = usuarios.findByCorreo(normalizar(correo))
                .orElseThrow(() -> ApiException.noEncontrado(
                        "No es posible realizar la recuperación con los datos proporcionados"));

        TokenRecuperacion token = new TokenRecuperacion();
        token.setUsuario(usuario);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiracion(Instant.now().plus(EXPIRACION_RECUPERACION_MINUTOS, ChronoUnit.MINUTES));
        tokens.saveAndFlush(token);

        String enlace = urlFrontend + "/restablecer-contrasena?token=" + token.getToken();
        emailService.enviarCorreo(
                usuario.getCorreo(),
                "Recupera el acceso a tu cuenta",
                "Para restablecer tu contraseña, ingresa a este enlace (vence en "
                        + EXPIRACION_RECUPERACION_MINUTOS + " minutos): " + enlace);
    }

    /** HU04: valida el token (existe, no usado, no expirado) y actualiza la contraseña. */
    @Transactional
    public void restablecerContrasena(RestablecerContrasenaRequest req) {
        if (!req.nuevaContrasena().equals(req.confirmarContrasena())) {
            throw ApiException.invalido("La confirmación no coincide con la nueva contraseña");
        }
        TokenRecuperacion token = tokens.findByToken(req.token())
                .orElseThrow(() -> ApiException.invalido("El enlace de recuperación ya no es válido"));
        if (token.isUsado() || token.getExpiracion().isBefore(Instant.now())) {
            throw ApiException.invalido("El enlace de recuperación ya no es válido");
        }
        Usuario usuario = token.getUsuario();
        usuario.setContrasenaHash(encoder.encode(req.nuevaContrasena()));
        token.setUsado(true);
        usuarios.saveAndFlush(usuario);
        tokens.saveAndFlush(token);
    }

    private String normalizar(String correo) {
        return correo.trim().toLowerCase(Locale.ROOT);
    }
}
