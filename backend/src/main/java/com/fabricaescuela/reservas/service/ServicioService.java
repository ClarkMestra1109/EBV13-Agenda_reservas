package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.EstadoReserva;
import com.fabricaescuela.reservas.domain.EstadoServicio;
import com.fabricaescuela.reservas.domain.Servicio;
import com.fabricaescuela.reservas.domain.Usuario;
import com.fabricaescuela.reservas.dto.CatalogoServicioResponse;
import com.fabricaescuela.reservas.dto.ServicioRequest;
import com.fabricaescuela.reservas.dto.ServicioResponse;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.ReservaRepository;
import com.fabricaescuela.reservas.repository.ServicioRepository;
import com.fabricaescuela.reservas.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ServicioService {

    private final ServicioRepository servicios;
    private final UsuarioRepository usuarios;
    private final ReservaRepository reservas;

    public ServicioService(ServicioRepository servicios, UsuarioRepository usuarios, ReservaRepository reservas) {
        this.servicios = servicios;
        this.usuarios = usuarios;
        this.reservas = reservas;
    }

    /** HU05: el proveedor autenticado crea un servicio; queda ACTIVO para configurarle su agenda. */
    @Transactional
    public ServicioResponse crear(Long proveedorId, ServicioRequest req) {
        Usuario proveedor = usuarios.findById(proveedorId)
                .orElseThrow(() -> ApiException.noAutenticado("Debe iniciar sesión para realizar esta operación"));
        Servicio servicio = new Servicio();
        servicio.setProveedor(proveedor);
        servicio.setEstado(EstadoServicio.ACTIVO);
        aplicar(servicio, req);
        return ServicioResponse.desde(servicios.saveAndFlush(servicio));
    }

    /** Listado de los servicios del proveedor (HU05: "debe aparecer en el listado"). */
    @Transactional(readOnly = true)
    public List<ServicioResponse> listarPropios(Long proveedorId) {
        return servicios.findByProveedorIdOrderByFechaCreacionDesc(proveedorId).stream()
                .map(ServicioResponse::desde)
                .toList();
    }

    /** Servicios activos de todos los proveedores, para que el cliente elija dónde reservar. */
    @Transactional(readOnly = true)
    public List<CatalogoServicioResponse> catalogo() {
        return servicios.findByEstadoOrderByNombreAsc(EstadoServicio.ACTIVO).stream()
                .map(CatalogoServicioResponse::desde)
                .toList();
    }

    /** HU06: solo el proveedor dueño puede modificar su servicio; uno eliminado ya no es editable. */
    @Transactional
    public ServicioResponse actualizar(Long proveedorId, Long servicioId, ServicioRequest req) {
        Servicio servicio = servicios.findById(servicioId)
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
        if (!servicio.getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso para modificar este servicio");
        }
        if (servicio.getEstado() == EstadoServicio.ELIMINADO) {
            throw ApiException.conflicto("El servicio fue eliminado y ya no puede modificarse");
        }
        aplicar(servicio, req);
        return ServicioResponse.desde(servicios.saveAndFlush(servicio));
    }

    /**
     * HU06: baja lógica de un servicio propio. Se protege si todavía tiene reservas
     * confirmadas vigentes; en ese caso el proveedor debe esperar a que terminen o pedir
     * al cliente que cancele primero.
     */
    @Transactional
    public void eliminar(Long proveedorId, Long servicioId) {
        Servicio servicio = servicios.findById(servicioId)
                .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
        if (!servicio.getProveedor().getId().equals(proveedorId)) {
            throw ApiException.prohibido("No tiene permiso para eliminar este servicio");
        }
        if (servicio.getEstado() == EstadoServicio.ELIMINADO) {
            throw ApiException.conflicto("El servicio ya fue eliminado");
        }
        if (reservas.existeReservaVigentePorServicio(servicioId, EstadoReserva.CONFIRMADA, Instant.now())) {
            throw ApiException.conflicto("No se puede eliminar un servicio con reservas confirmadas vigentes");
        }
        servicio.setEstado(EstadoServicio.ELIMINADO);
        servicios.saveAndFlush(servicio);
    }

    private void aplicar(Servicio servicio, ServicioRequest req) {
        servicio.setNombre(req.nombre().trim());
        servicio.setDescripcion(req.descripcion().trim());
        servicio.setDuracionMin(req.duracionMin());
        servicio.setPrecio(req.precio());
        if (req.estado() != null) {
            if (req.estado() == EstadoServicio.ELIMINADO) {
                throw ApiException.invalido("Use la opción de eliminar servicio para esta operación");
            }
            servicio.setEstado(req.estado());
        }
    }
}
