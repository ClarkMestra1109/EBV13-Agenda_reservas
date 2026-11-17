package com.fabricaescuela.reservas.security;

import com.fabricaescuela.reservas.domain.Rol;
import com.fabricaescuela.reservas.domain.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    /** Valor de ejemplo de application.properties: es público, solo sirve para desarrollo local. */
    private static final String SECRETO_DE_EJEMPLO = "cambia-este-secreto-en-produccion-1234567890";

    private final SecretKey clave;
    private final long expiracionMinutos;

    public JwtService(@Value("${app.jwt.secret}") String secreto,
                      @Value("${app.jwt.expiration-minutes}") long expiracionMinutos) {
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET debe tener al menos 32 caracteres");
        }
        if (SECRETO_DE_EJEMPLO.equals(secreto)) {
            log.error("SEGURIDAD: se está usando el JWT_SECRET de ejemplo, que es público. "
                    + "Defina la variable de entorno JWT_SECRET con un valor propio y secreto "
                    + "antes de exponer este backend en internet.");
        }
        this.clave = Keys.hmacShaKeyFor(bytes);
        this.expiracionMinutos = expiracionMinutos;
    }

    public String generar(Usuario usuario) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(usuario.getId()))
                .claim("correo", usuario.getCorreo())
                .claim("rol", usuario.getRol().name())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plus(expiracionMinutos, ChronoUnit.MINUTES)))
                .signWith(clave)
                .compact();
    }

    /** Lanza JwtException o IllegalArgumentException si el token no es válido o expiró. */
    public UsuarioAutenticado leer(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(clave)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return new UsuarioAutenticado(
                Long.valueOf(claims.getSubject()),
                claims.get("correo", String.class),
                Rol.valueOf(claims.get("rol", String.class)));
    }
}
