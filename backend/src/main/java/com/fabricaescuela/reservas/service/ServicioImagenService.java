package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.EstadoServicio;
import com.fabricaescuela.reservas.domain.Servicio;
import com.fabricaescuela.reservas.domain.ServicioImagen;
import com.fabricaescuela.reservas.dto.ServicioResponse;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.ServicioImagenRepository;
import com.fabricaescuela.reservas.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Foto de los servicios: se guarda en la base de datos y se sirve públicamente en el catálogo. */
@Service
public class ServicioImagenService {

    /** Tamaño máximo de la imagen ya decodificada (el frontend la comprime antes de enviarla). */
    private static final int BYTES_MAXIMOS = 2_500_000;
    private static final Pattern DATA_URL =
            Pattern.compile("^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\\s]+)$");

    /** Imagen lista para enviar al navegador. */
    public record Archivo(String tipo, byte[] contenido) {
    }

    private final ServicioRepository servicios;
    private final ServicioImagenRepository imagenes;

    public ServicioImagenService(ServicioRepository servicios, ServicioImagenRepository imagenes) {
        this.servicios = servicios;
        this.imagenes = imagenes;
    }

    @Transactional
    public ServicioResponse guardar(Long proveedorId, Long servicioId, String dataUrl) {
        Servicio servicio = servicioPropioVigente(proveedorId, servicioId);

        Matcher m = DATA_URL.matcher(dataUrl.trim());
        if (!m.matches()) {
            throw ApiException.invalido("La foto debe ser una imagen JPG, PNG o WebP");
        }
        String tipo = m.group(1);
        byte[] bytes;
        try {
            bytes = Base64.getMimeDecoder().decode(m.group(2));
        } catch (IllegalArgumentException e) {
            throw ApiException.invalido("La foto está dañada o incompleta");
        }
        if (bytes.length == 0 || bytes.length > BYTES_MAXIMOS) {
            throw ApiException.invalido("La foto debe pesar menos de 2,5 MB");
        }
        // No basta con lo que dice el encabezado: se verifica que el contenido sea de verdad una imagen.
        if (!coincideConTipo(tipo, bytes)) {
            throw ApiException.invalido("El archivo no es una imagen JPG, PNG o WebP válida");
        }

        ServicioImagen imagen = imagenes.findById(servicioId).orElseGet(() -> new ServicioImagen(servicioId));
        Instant ahora = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        imagen.setTipo(tipo);
        imagen.setDatosBase64(Base64.getEncoder().encodeToString(bytes));
        imagen.setActualizada(ahora);
        imagenes.save(imagen);
        servicio.setImagenActualizada(ahora);
        return ServicioResponse.desde(servicios.saveAndFlush(servicio));
    }

    @Transactional
    public ServicioResponse eliminar(Long proveedorId, Long servicioId) {
        Servicio servicio = servicioPropioVigente(proveedorId, servicioId);
        imagenes.deleteById(servicioId);
        servicio.setImagenActualizada(null);
        return ServicioResponse.desde(servicios.saveAndFlush(servicio));
    }

    /** Foto pública de un servicio no eliminado (el catálogo la muestra sin iniciar sesión). */
    @Transactional(readOnly = true)
    public Archivo obtener(Long servicioId) {
        Servicio servicio = servicios.findById(servicioId)
                .filter(s -> s.getEstado() != EstadoServicio.ELIMINADO)
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
        ServicioImagen imagen = imagenes.findById(servicio.getId())
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no tiene foto"));
        return new Archivo(imagen.getTipo(), Base64.getDecoder().decode(imagen.getDatosBase64()));
    }

    private Servicio servicioPropioVigente(Long proveedorId, Long servicioId) {
        Servicio servicio = servicios.findById(servicioId)
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
        if (!servicio.getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso sobre este servicio");
        }
        if (servicio.getEstado() == EstadoServicio.ELIMINADO) {
            throw ApiException.conflicto("El servicio fue eliminado y ya no puede modificarse");
        }
        return servicio;
    }

    private static final Map<String, byte[]> FIRMAS = Map.of(
            "image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
            "image/png", new byte[]{(byte) 0x89, 'P', 'N', 'G'});

    private static boolean coincideConTipo(String tipo, byte[] b) {
        if ("image/webp".equals(tipo)) {
            return b.length > 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                    && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
        }
        byte[] firma = FIRMAS.get(tipo);
        if (firma == null || b.length < firma.length) {
            return false;
        }
        for (int i = 0; i < firma.length; i++) {
            if (b[i] != firma[i]) {
                return false;
            }
        }
        return true;
    }
}
