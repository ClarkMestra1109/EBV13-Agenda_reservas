package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.Usuario;
import com.fabricaescuela.reservas.dto.ActualizarPerfilRequest;
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

    private final UsuarioRepository usuarios;

    public UsuarioService(UsuarioRepository usuarios) {
        this.usuarios = usuarios;
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
        usuario.setTelefono(req.telefono() == null ? null : req.telefono().trim());
        try {
            usuarios.saveAndFlush(usuario);
        } catch (DataIntegrityViolationException e) {
            throw ApiException.conflicto(CORREO_REGISTRADO);
        }
        return UsuarioResponse.desde(usuario);
    }

    private Usuario usuarioPropio(Long usuarioId) {
        return usuarios.findById(usuarioId)
                .orElseThrow(() -> ApiException.noAutenticado("Debe iniciar sesión para realizar esta operación"));
    }
}
