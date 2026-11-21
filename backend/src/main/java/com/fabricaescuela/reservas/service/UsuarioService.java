package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.Usuario;
import com.fabricaescuela.reservas.domain.Rol;
import com.fabricaescuela.reservas.dto.ActualizarPerfilRequest;
import com.fabricaescuela.reservas.dto.CambiarContrasenaRequest;
import com.fabricaescuela.reservas.repository.TokenRecuperacionRepository;
import com.fabricaescuela.reservas.security.LimitadorIntentos;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.Duration;
import com.fabricaescuela.reservas.dto.UsuarioResponse;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/** HU03: consultar y actualizar el perfil propio. */
@Service
public class UsuarioService {

    private static final String CORREO_REGISTRADO = "El correo electrónico ya se encuentra registrado";

    private static final int MAX_INTENTOS_CAMBIO = 5;
    private static final Duration VENTANA_INTENTOS = Duration.ofMinutes(15);

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final TokenRecuperacionRepository tokens;
    private final LimitadorIntentos limitador;

    public UsuarioService(UsuarioRepository usuarios, PasswordEncoder encoder,
                          TokenRecuperacionRepository tokens, LimitadorIntentos limitador) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.tokens = tokens;
        this.limitador = limitador;
    }

    @Transactional(readOnly = true)
    public UsuarioResponse miPerfil(Long usuarioId) {
        return UsuarioResponse.desde(usuarioPropio(usuarioId));
    }

    @Transactional
    public UsuarioResponse actualizarPerfil(Long usuarioId, ActualizarPerfilRequest req) {
        Usuario usuario = usuarioPropio(usuarioId);
        String correo = req.correo().trim().toLowerCase(Locale.ROOT);
        if (usuarios.existsByCorreoAndIdNot(correo, usuarioId)) {
            throw ApiException.conflicto(CORREO_REGISTRADO);
        }
        usuario.setNombre(req.nombre().trim());
        usuario.setCorreo(correo);
        usuario.setTelefono(limpio(req.telefono()));
        if (usuario.getRol() == Rol.PROVEEDOR) {
            usuario.setNombreComercial(limpio(req.nombreComercial()));
            usuario.setSectorActividad(limpio(req.sectorActividad()));
            usuario.setDescripcionComercial(limpio(req.descripcionComercial()));
            usuario.setSitioWeb(limpio(req.sitioWeb()));
        }
        try {
            usuarios.saveAndFlush(usuario);
        } catch (DataIntegrityViolationException e) {
            throw ApiException.conflicto(CORREO_REGISTRADO);
        }
        return UsuarioResponse.desde(usuario);
    }

    /**
     * Cambia la contraseña verificando la actual. Tras 5 intentos fallidos se bloquea 15
     * minutos, y al cambiarla se anulan los enlaces de recuperación que estuvieran vigentes.
     */
    @Transactional
    public void cambiarContrasena(Long usuarioId, CambiarContrasenaRequest req) {
        Usuario usuario = usuarioPropio(usuarioId);
        String clave = "cambio-contrasena:" + usuarioId;
        long espera = limitador.minutosDeBloqueo(clave, MAX_INTENTOS_CAMBIO, VENTANA_INTENTOS);
        if (espera > 0) {
            throw ApiException.demasiadosIntentos(
                    "Demasiados intentos fallidos. Intente de nuevo en " + espera + " minuto(s)");
        }
        if (!encoder.matches(req.contrasenaActual(), usuario.getContrasenaHash())) {
            limitador.registrar(clave, VENTANA_INTENTOS);
            throw ApiException.invalido("La contraseña actual no es correcta");
        }
        if (!req.nuevaContrasena().equals(req.confirmarContrasena())) {
            throw ApiException.invalido("La confirmación no coincide con la nueva contraseña");
        }
        if (encoder.matches(req.nuevaContrasena(), usuario.getContrasenaHash())) {
            throw ApiException.invalido("La nueva contraseña debe ser diferente de la actual");
        }
        usuario.setContrasenaHash(encoder.encode(req.nuevaContrasena()));
        usuarios.saveAndFlush(usuario);
        tokens.invalidarVigentesDe(usuarioId);
        limitador.limpiar(clave);
    }

    private static String limpio(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private Usuario usuarioPropio(Long usuarioId) {
        return usuarios.findById(usuarioId)
                .orElseThrow(() -> ApiException.noAutenticado("Debe iniciar sesión para realizar esta operación"));
    }
}
