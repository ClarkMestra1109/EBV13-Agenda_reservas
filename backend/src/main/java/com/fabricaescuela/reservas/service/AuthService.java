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
import com.fabricaescuela.reservas.security.LimitadorIntentos;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private static final String CORREO_REGISTRADO = "El correo electrónico ya se encuentra registrado";
    private static final long EXPIRACION_RECUPERACION_MINUTOS = 30;
    // Límite de intentos: 5 inicios de sesión fallidos o 3 solicitudes de recuperación por
    // correo cada 15 minutos.
    private static final int MAX_LOGIN_FALLIDOS = 5;
    private static final int MAX_SOLICITUDES_RECUPERACION = 3;
    private static final Duration VENTANA_INTENTOS = Duration.ofMinutes(15);

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final TokenRecuperacionRepository tokens;
    private final EmailService emailService;
    private final String urlFrontend;
    private final LimitadorIntentos limitador;

    public AuthService(UsuarioRepository usuarios, PasswordEncoder encoder, JwtService jwt,
                       TokenRecuperacionRepository tokens, EmailService emailService,
                       LimitadorIntentos limitador,
                       @Value("${app.frontend.url}") String urlFrontend) {
        this.limitador = limitador;
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
        String correo = normalizar(req.correo());
        String clave = "login:" + correo;
        long espera = limitador.minutosDeBloqueo(clave, MAX_LOGIN_FALLIDOS, VENTANA_INTENTOS);
        if (espera > 0) {
            throw ApiException.demasiadosIntentos(
                    "Demasiados intentos fallidos. Intente de nuevo en " + espera + " minuto(s)");
        }
        Usuario usuario = usuarios.findByCorreo(correo)
                .filter(u -> encoder.matches(req.contrasena(), u.getContrasenaHash()))
                .orElse(null);
        if (usuario == null) {
            limitador.registrar(clave, VENTANA_INTENTOS);
            throw ApiException.noAutenticado("Credenciales incorrectas");
        }
        limitador.limpiar(clave);
        return new AuthResponse(jwt.generar(usuario), UsuarioResponse.desde(usuario));
    }

    /**
     * HU04: genera un token de un solo uso y "envía" el enlace de recuperación al correo.
     * Si el correo no está registrado, se informa explícitamente (así lo pide el criterio de
     * aceptación de esta HU), a diferencia de HU02 donde por seguridad no se distingue el motivo.
     */
    @Transactional
    public void solicitarRecuperacion(String correo) {
        String correoNormalizado = normalizar(correo);
        String clave = "recuperar:" + correoNormalizado;
        long espera = limitador.minutosDeBloqueo(clave, MAX_SOLICITUDES_RECUPERACION, VENTANA_INTENTOS);
        if (espera > 0) {
            throw ApiException.demasiadosIntentos(
                    "Demasiadas solicitudes de recuperación. Intente de nuevo en " + espera + " minuto(s)");
        }
        limitador.registrar(clave, VENTANA_INTENTOS);

        Usuario usuario = usuarios.findByCorreo(correoNormalizado)
                .orElseThrow(() -> ApiException.noEncontrado(
                        "No es posible realizar la recuperación con los datos proporcionados"));

        // Solo el enlace más reciente es válido: los anteriores quedan anulados.
        tokens.invalidarVigentesDe(usuario.getId());

        TokenRecuperacion token = new TokenRecuperacion();
        token.setUsuario(usuario);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiracion(Instant.now().plus(EXPIRACION_RECUPERACION_MINUTOS, ChronoUnit.MINUTES));
        tokens.saveAndFlush(token);

        // El frontend es una SPA sin rutas propias por URL (Vercel no tiene reglas de
        // reescritura configuradas), así que el enlace apunta a la raíz con el token como
        // parámetro; App.tsx lo detecta al cargar y abre la pantalla de restablecer.
        String enlace = urlFrontend + "/?token=" + token.getToken();
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
        // Tras el cambio no debe quedar ningún otro enlace utilizable, y se levanta el bloqueo
        // por intentos fallidos para que el usuario pueda entrar con su nueva contraseña.
        tokens.invalidarVigentesDe(usuario.getId());
        limitador.limpiar("login:" + usuario.getCorreo());
    }

    private String normalizar(String correo) {
        return correo.trim().toLowerCase(Locale.ROOT);
    }
}
