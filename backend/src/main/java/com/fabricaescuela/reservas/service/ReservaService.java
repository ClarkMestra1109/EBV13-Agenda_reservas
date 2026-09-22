package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.EstadoFranja;
import com.fabricaescuela.reservas.domain.EstadoReserva;
import com.fabricaescuela.reservas.domain.Franja;
import com.fabricaescuela.reservas.domain.HistorialEstadoReserva;
import com.fabricaescuela.reservas.domain.Reserva;
import com.fabricaescuela.reservas.domain.Rol;
import com.fabricaescuela.reservas.domain.Usuario;
import com.fabricaescuela.reservas.dto.ReservaResponse;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.FranjaRepository;
import com.fabricaescuela.reservas.repository.HistorialEstadoReservaRepository;
import com.fabricaescuela.reservas.repository.ReservaRepository;
import com.fabricaescuela.reservas.repository.UsuarioRepository;
import com.fabricaescuela.reservas.security.UsuarioAutenticado;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ReservaService {

    private final ReservaRepository reservas;
    private final FranjaRepository franjas;
    private final UsuarioRepository usuarios;
    private final HistorialEstadoReservaRepository historial;

    public ReservaService(ReservaRepository reservas, FranjaRepository franjas,
                          UsuarioRepository usuarios, HistorialEstadoReservaRepository historial) {
        this.reservas = reservas;
        this.franjas = franjas;
        this.usuarios = usuarios;
        this.historial = historial;
    }

    /**
     * HU14: el cliente confirma una franja disponible; se crea la reserva y se ocupa un cupo.
     * La fila de la franja queda bloqueada durante la transacción: si dos clientes piden el
     * último cupo, el segundo espera, ve la franja llena y recibe 409.
     */
    @Transactional
    public ReservaResponse confirmar(Long clienteId, Long franjaId) {
        Franja franja = franjas.buscarParaActualizar(franjaId)
                .orElseThrow(() -> ApiException.noEncontrado("La franja no existe"));
        if (franja.getEstado() != EstadoFranja.PUBLICADA || !franja.getInicio().isAfter(Instant.now())) {
            throw ApiException.conflicto("La franja ya no está disponible");
        }
        if (franja.getCuposOcupados() >= franja.getCupoTotal()) {
            throw ApiException.conflicto("No quedan cupos disponibles en esta franja");
        }
        if (reservas.existsByClienteIdAndFranjaIdAndEstado(clienteId, franjaId, EstadoReserva.CONFIRMADA)) {
            throw ApiException.conflicto("Ya tiene una reserva confirmada en esta franja");
        }
        Usuario cliente = usuarios.findById(clienteId)
                .orElseThrow(() -> ApiException.noAutenticado("Debe iniciar sesión para realizar esta operación"));

        franja.setCuposOcupados(franja.getCuposOcupados() + 1);

        Reserva reserva = new Reserva();
        reserva.setCliente(cliente);
        reserva.setFranja(franja);
        reserva.setEstado(EstadoReserva.CONFIRMADA);
        reservas.saveAndFlush(reserva);
        historial.save(new HistorialEstadoReserva(reserva, cliente, null, EstadoReserva.CONFIRMADA.name()));
        return ReservaResponse.desde(reserva);
    }

    /** HU15: el cliente cancela una reserva futura propia y el cupo queda libre otra vez. */
    @Transactional
    public ReservaResponse cancelar(Long clienteId, Long reservaId) {
        Reserva reserva = reservas.buscarParaActualizar(reservaId)
                .orElseThrow(() -> ApiException.noEncontrado("La reserva no existe"));
        if (!reserva.getCliente().getId().equals(clienteId)) {
            throw ApiException.prohibido("No tiene permiso para cancelar esta reserva");
        }
        if (reserva.getEstado() != EstadoReserva.CONFIRMADA) {
            throw ApiException.conflicto("La reserva ya está cancelada");
        }
        Franja franja = franjas.buscarParaActualizar(reserva.getFranja().getId())
                .orElseThrow(() -> ApiException.noEncontrado("La franja no existe"));
        Instant ahora = Instant.now();
        if (!franja.getInicio().isAfter(ahora)) {
            throw ApiException.conflicto("Solo se pueden cancelar reservas futuras");
        }
        reserva.setEstado(EstadoReserva.CANCELADA);
        reserva.setFechaCancelacion(ahora);
        franja.setCuposOcupados(Math.max(0, franja.getCuposOcupados() - 1));
        reservas.saveAndFlush(reserva);
        historial.save(new HistorialEstadoReserva(reserva, reserva.getCliente(),
                EstadoReserva.CONFIRMADA.name(), EstadoReserva.CANCELADA.name()));
        return ReservaResponse.desde(reserva);
    }

    /**
     * HU17: cada usuario ve solo lo suyo. El cliente, sus reservas vigentes; el proveedor,
     * las reservas vigentes de sus propios servicios.
     */
    @Transactional(readOnly = true)
    public List<ReservaResponse> agenda(UsuarioAutenticado usuario) {
        Instant ahora = Instant.now();
        List<Reserva> lista = usuario.rol() == Rol.CLIENTE
                ? reservas.agendaDeCliente(usuario.id(), EstadoReserva.CONFIRMADA, ahora)
                : reservas.agendaDeProveedor(usuario.id(), EstadoReserva.CONFIRMADA, ahora);
        return lista.stream().map(ReservaResponse::desde).toList();
    }
}
