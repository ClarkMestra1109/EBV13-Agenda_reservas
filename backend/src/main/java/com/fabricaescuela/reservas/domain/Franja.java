package com.fabricaescuela.reservas.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

/** Franja horaria concreta en la que un proveedor atiende un servicio, con un número de cupos. */
@Entity
@Table(name = "franja")
public class Franja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_franja")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_servicio", nullable = false)
    private Servicio servicio;

    @Column(name = "fecha_hora_inicio", nullable = false)
    private Instant inicio;

    @Column(name = "fecha_hora_fin", nullable = false)
    private Instant fin;

    @Column(name = "cupo_total", nullable = false)
    private Integer cupoTotal;

    @Column(name = "cupos_ocupados", nullable = false)
    private Integer cuposOcupados = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoFranja estado;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private Instant fechaCreacion;

    @PrePersist
    void alCrear() {
        this.fechaCreacion = Instant.now();
    }

    public int cuposDisponibles() {
        return cupoTotal - cuposOcupados;
    }

    public Long getId() { return id; }
    public Servicio getServicio() { return servicio; }
    public void setServicio(Servicio servicio) { this.servicio = servicio; }
    public Instant getInicio() { return inicio; }
    public void setInicio(Instant inicio) { this.inicio = inicio; }
    public Instant getFin() { return fin; }
    public void setFin(Instant fin) { this.fin = fin; }
    public Integer getCupoTotal() { return cupoTotal; }
    public void setCupoTotal(Integer cupoTotal) { this.cupoTotal = cupoTotal; }
    public Integer getCuposOcupados() { return cuposOcupados; }
    public void setCuposOcupados(Integer cuposOcupados) { this.cuposOcupados = cuposOcupados; }
    public EstadoFranja getEstado() { return estado; }
    public void setEstado(EstadoFranja estado) { this.estado = estado; }
    public Instant getFechaCreacion() { return fechaCreacion; }
}
