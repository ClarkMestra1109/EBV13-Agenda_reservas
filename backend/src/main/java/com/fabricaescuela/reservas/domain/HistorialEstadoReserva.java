package com.fabricaescuela.reservas.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/** Un registro por cada cambio de estado de una reserva (base del historial y de los reportes). */
@Entity
@Table(name = "historial_estado_reserva")
public class HistorialEstadoReserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historial")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_reserva", nullable = false)
    private Reserva reserva;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "estado_anterior", length = 20)
    private String estadoAnterior;

    @Column(name = "estado_nuevo", nullable = false, length = 20)
    private String estadoNuevo;

    @Column(name = "fecha_cambio", nullable = false)
    private Instant fechaCambio;

    protected HistorialEstadoReserva() {
    }

    public HistorialEstadoReserva(Reserva reserva, Usuario usuario, String estadoAnterior, String estadoNuevo) {
        this.reserva = reserva;
        this.usuario = usuario;
        this.estadoAnterior = estadoAnterior;
        this.estadoNuevo = estadoNuevo;
        this.fechaCambio = Instant.now();
    }

    public Long getId() { return id; }
    public Reserva getReserva() { return reserva; }
    public Usuario getUsuario() { return usuario; }
    public String getEstadoAnterior() { return estadoAnterior; }
    public String getEstadoNuevo() { return estadoNuevo; }
    public Instant getFechaCambio() { return fechaCambio; }
}
