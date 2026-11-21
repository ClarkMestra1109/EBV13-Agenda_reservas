package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.EstadoReserva;
import com.fabricaescuela.reservas.domain.Recurso;
import com.fabricaescuela.reservas.domain.Reserva;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.RecursoRepository;
import com.fabricaescuela.reservas.repository.ReservaRepository;
import com.fabricaescuela.reservas.repository.ServicioRecursoRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * HU09: controla que ningún recurso atienda más reservas simultáneas que su capacidad.
 *
 * <p>La ocupación de un recurso en un instante es la cantidad de reservas confirmadas, de
 * cualquiera de los servicios que lo usan, cuyo horario contiene ese instante. Una reserva
 * nueva cabe si, durante todo su horario, la ocupación se mantiene por debajo de la
 * capacidad. Cancelar una reserva o aumentar la capacidad libera cupos de inmediato, porque
 * la ocupación se calcula siempre a partir de las reservas confirmadas.
 */
@Component
public class CapacidadRecursos {

    private final RecursoRepository recursos;
    private final ServicioRecursoRepository vinculos;
    private final ReservaRepository reservas;

    public CapacidadRecursos(RecursoRepository recursos, ServicioRecursoRepository vinculos,
                             ReservaRepository reservas) {
        this.recursos = recursos;
        this.vinculos = vinculos;
        this.reservas = reservas;
    }

    /**
     * Verifica, con los recursos del servicio bloqueados, que quepa una reserva más en
     * [inicio, fin). Debe llamarse dentro de la transacción que crea o mueve la reserva.
     *
     * @param reservaExcluida reserva que se está reprogramando (no cuenta), o null.
     */
    public void verificarCupo(Long servicioId, Instant inicio, Instant fin, Long reservaExcluida) {
        List<Long> ids = vinculos.idsDeRecursosDelServicio(servicioId);
        if (ids.isEmpty()) {
            return; // el servicio no usa recursos: solo aplican los cupos del horario
        }
        for (Recurso recurso : recursos.bloquearEnOrden(ids)) {
            int ocupacion = ocupacionMaxima(recurso.getId(), inicio, fin, reservaExcluida);
            if (ocupacion >= recurso.getCapacidad()) {
                throw ApiException.conflicto("No hay disponibilidad en ese horario: el recurso \""
                        + recurso.getNombre() + "\" ya tiene ocupada toda su capacidad ("
                        + recurso.getCapacidad() + ")");
            }
        }
    }

    /**
     * Cupos que los recursos del servicio aún permiten en [inicio, fin): el mínimo entre sus
     * recursos, o null si el servicio no usa recursos. Solo lectura (para el catálogo).
     */
    public Integer cuposLibres(Long servicioId, Instant inicio, Instant fin) {
        List<Long> ids = vinculos.idsDeRecursosDelServicio(servicioId);
        if (ids.isEmpty()) {
            return null;
        }
        int minimo = Integer.MAX_VALUE;
        for (Recurso recurso : recursos.findAllById(ids)) {
            int libres = recurso.getCapacidad() - ocupacionMaxima(recurso.getId(), inicio, fin, null);
            minimo = Math.min(minimo, Math.max(0, libres));
        }
        return minimo;
    }

    /** Mayor número de reservas confirmadas simultáneas que usan el recurso dentro de [desde, hasta). */
    public int ocupacionMaxima(Long recursoId, Instant desde, Instant hasta, Long reservaExcluida) {
        List<Reserva> cruzadas = reservas.queUsanRecursoEnRango(recursoId, EstadoReserva.CONFIRMADA,
                desde, hasta, reservaExcluida == null ? -1L : reservaExcluida);
        List<Instant[]> intervalos = new ArrayList<>(cruzadas.size());
        for (Reserva r : cruzadas) {
            intervalos.add(new Instant[]{r.getFranja().getInicio(), r.getFranja().getFin()});
        }
        return maximoSimultaneo(intervalos, desde, hasta);
    }

    /**
     * Barrido de eventos: cuántos intervalos [inicio, fin) se superponen como máximo dentro de
     * [desde, hasta). Un intervalo que termina justo cuando empieza otro no se superpone.
     */
    static int maximoSimultaneo(List<Instant[]> intervalos, Instant desde, Instant hasta) {
        List<Object[]> eventos = new ArrayList<>(intervalos.size() * 2);
        for (Instant[] intervalo : intervalos) {
            Instant ini = intervalo[0].isBefore(desde) ? desde : intervalo[0];
            Instant fin = intervalo[1].isAfter(hasta) ? hasta : intervalo[1];
            if (ini.isBefore(fin)) {
                eventos.add(new Object[]{ini, 1});
                eventos.add(new Object[]{fin, -1});
            }
        }
        // A igual instante, primero las salidas (-1) y luego las entradas (+1).
        eventos.sort(Comparator.<Object[], Instant>comparing(e -> (Instant) e[0])
                .thenComparingInt(e -> (Integer) e[1]));
        int actual = 0;
        int maximo = 0;
        for (Object[] evento : eventos) {
            actual += (Integer) evento[1];
            maximo = Math.max(maximo, actual);
        }
        return maximo;
    }
}
