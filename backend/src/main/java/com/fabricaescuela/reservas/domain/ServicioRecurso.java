package com.fabricaescuela.reservas.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/** HU08: vínculo entre un servicio y un recurso que ese servicio utiliza. */
@Entity
@Table(name = "servicio_recurso",
        uniqueConstraints = @UniqueConstraint(name = "uk_servicio_recurso",
                columnNames = {"id_servicio", "id_recurso"}))
public class ServicioRecurso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_servicio_recurso")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_servicio", nullable = false)
    private Servicio servicio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_recurso", nullable = false)
    private Recurso recurso;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private Instant fechaCreacion;

    protected ServicioRecurso() {
    }

    public ServicioRecurso(Servicio servicio, Recurso recurso) {
        this.servicio = servicio;
        this.recurso = recurso;
    }

    @PrePersist
    void alCrear() {
        this.fechaCreacion = Instant.now();
    }

    public Long getId() { return id; }
    public Servicio getServicio() { return servicio; }
    public Recurso getRecurso() { return recurso; }
    public Instant getFechaCreacion() { return fechaCreacion; }
}
