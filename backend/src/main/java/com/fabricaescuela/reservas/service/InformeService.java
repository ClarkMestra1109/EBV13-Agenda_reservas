package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.EstadoFranja;
import com.fabricaescuela.reservas.domain.EstadoReserva;
import com.fabricaescuela.reservas.domain.Franja;
import com.fabricaescuela.reservas.domain.Reserva;
import com.fabricaescuela.reservas.domain.Servicio;
import com.fabricaescuela.reservas.dto.InformeResponse;
import com.fabricaescuela.reservas.error.ApiException;
import com.fabricaescuela.reservas.repository.FranjaRepository;
import com.fabricaescuela.reservas.repository.ReservaRepository;
import com.fabricaescuela.reservas.repository.ServicioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * HU20 (contar reservas), HU21 (ocupación), HU22 (filtros) y HU23 (datos para exportar).
 * Todo se calcula en el servidor y solo con los servicios del proveedor que consulta.
 */
@Service
public class InformeService {

    private static final ZoneId ZONA = ZoneId.of("America/Bogota");
    private static final long DIAS_MAXIMOS = 366;

    private final ReservaRepository reservas;
    private final FranjaRepository franjas;
    private final ServicioRepository servicios;

    public InformeService(ReservaRepository reservas, FranjaRepository franjas, ServicioRepository servicios) {
        this.reservas = reservas;
        this.franjas = franjas;
        this.servicios = servicios;
    }

    @Transactional(readOnly = true)
    public InformeResponse generar(Long proveedorId, LocalDate desde, LocalDate hasta, Long servicioId) {
        if (desde == null || hasta == null) {
            throw ApiException.invalido("Seleccione la fecha inicial y la fecha final del periodo");
        }
        if (desde.isAfter(hasta)) {
            throw ApiException.invalido("El rango de fechas no es válido: la fecha inicial es posterior a la fecha final");
        }
        if (ChronoUnit.DAYS.between(desde, hasta) + 1 > DIAS_MAXIMOS) {
            throw ApiException.invalido("El periodo consultado no puede superar un año");
        }
        String nombreServicio = null;
        if (servicioId != null) {
            Servicio servicio = servicios.findById(servicioId)
                    .orElseThrow(() -> ApiException.noEncontrado("El servicio no existe"));
            if (!servicio.getProveedor().getId().equals(proveedorId)) {
                throw ApiException.prohibido("No tiene permiso sobre este servicio");
            }
            nombreServicio = servicio.getNombre();
        }

        // Fechas inclusivas: desde las 00:00 del día inicial hasta las 00:00 del día siguiente al final.
        Instant inicio = desde.atStartOfDay(ZONA).toInstant();
        Instant fin = hasta.plusDays(1).atStartOfDay(ZONA).toInstant();

        List<Reserva> delPeriodo = reservas.delProveedorEnPeriodo(proveedorId, inicio, fin, servicioId);
        List<Franja> disponibilidad = franjas.delProveedorEnPeriodo(proveedorId, EstadoFranja.PUBLICADA,
                inicio, fin, servicioId);

        Map<Long, Acumulado> porServicio = new LinkedHashMap<>();
        Acumulado total = new Acumulado(null, null);
        BigDecimal ingresos = BigDecimal.ZERO;
        List<InformeResponse.Detalle> detalle = new ArrayList<>(delPeriodo.size());

        for (Reserva r : delPeriodo) {
            Servicio s = r.getFranja().getServicio();
            Acumulado acc = porServicio.computeIfAbsent(s.getId(), k -> new Acumulado(s.getId(), s.getNombre()));
            boolean confirmada = r.getEstado() == EstadoReserva.CONFIRMADA;
            if (confirmada) {
                acc.reservas++;
                total.reservas++;
                ingresos = ingresos.add(s.getPrecio());
            } else {
                acc.canceladas++;
                total.canceladas++;
            }
            detalle.add(new InformeResponse.Detalle(r.getId(), r.getFranja().getInicio(), r.getFranja().getFin(),
                    s.getId(), s.getNombre(), r.getCliente().getNombre(), r.getEstado().name(),
                    confirmada ? s.getPrecio() : BigDecimal.ZERO));
        }
        for (Franja f : disponibilidad) {
            Servicio s = f.getServicio();
            Acumulado acc = porServicio.computeIfAbsent(s.getId(), k -> new Acumulado(s.getId(), s.getNombre()));
            acc.publicados += f.getCupoTotal();
            acc.reservados += f.getCuposOcupados();
            total.publicados += f.getCupoTotal();
            total.reservados += f.getCuposOcupados();
        }

        InformeResponse.Resumen resumen = new InformeResponse.Resumen(
                total.reservas, total.canceladas, total.publicados, total.reservados,
                Math.max(0, total.publicados - total.reservados),
                porcentaje(total.reservados, total.publicados), ingresos);
        List<InformeResponse.PorServicio> filas = porServicio.values().stream()
                .sorted((a, b) -> a.nombre.compareToIgnoreCase(b.nombre))
                .map(a -> new InformeResponse.PorServicio(a.id, a.nombre, a.reservas, a.canceladas,
                        a.publicados, a.reservados, porcentaje(a.reservados, a.publicados)))
                .toList();
        return new InformeResponse(desde, hasta, servicioId, nombreServicio, resumen, filas, detalle);
    }

    private static Double porcentaje(long parte, long total) {
        if (total == 0) {
            return null;
        }
        return BigDecimal.valueOf(parte * 100.0 / total).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private static final class Acumulado {
        final Long id;
        final String nombre;
        long reservas;
        long canceladas;
        long publicados;
        long reservados;

        Acumulado(Long id, String nombre) {
            this.id = id;
            this.nombre = nombre;
        }
    }
}
