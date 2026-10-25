package com.fabricaescuela.reservas.service;

import com.fabricaescuela.reservas.domain.EstadoReserva;
import com.fabricaescuela.reservas.domain.Recordatorio;
import com.fabricaescuela.reservas.domain.Reserva;
import com.fabricaescuela.reservas.repository.RecordatorioRepository;
import com.fabricaescuela.reservas.repository.ReservaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.time.ZoneId;
import java.util.List;

/**
 * HU19: tarea programada que genera un recordatorio por cada reserva confirmada que empieza
 * dentro de la ventana configurada y todavía no tiene uno. Un fallo de envío queda registrado
 * en el propio recordatorio; la reserva nunca se toca ni cambia de estado.
 */
@Service
public class RecordatorioService {

    private static final Logger log = LoggerFactory.getLogger(RecordatorioService.class);
    private static final DateTimeFormatter FORMATO = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM, h:mm a")
            .withZone(ZoneId.of("America/Bogota"));

    private final ReservaRepository reservas;
    private final RecordatorioRepository recordatorios;
    private final EmailService emailService;
    private final long ventanaHoras;

    public RecordatorioService(ReservaRepository reservas, RecordatorioRepository recordatorios,
                               EmailService emailService,
                               @Value("${app.recordatorios.ventana-horas:24}") long ventanaHoras) {
        this.reservas = reservas;
        this.recordatorios = recordatorios;
        this.emailService = emailService;
        this.ventanaHoras = ventanaHoras;
    }

    @Scheduled(fixedRateString = "${app.recordatorios.intervalo-ms:300000}")
    @Transactional
    public void generarRecordatorios() {
        Instant ahora = Instant.now();
        Instant limite = ahora.plus(ventanaHoras, ChronoUnit.HOURS);
        List<Reserva> candidatas = reservas.pendientesDeRecordatorio(EstadoReserva.CONFIRMADA, ahora, limite);
        for (Reserva reserva : candidatas) {
            // Doble chequeo por si otra instancia ya generó el recordatorio (idempotencia).
            if (recordatorios.existsByReservaId(reserva.getId())) {
                continue;
            }
            generarRecordatorio(reserva);
        }
    }

    private void generarRecordatorio(Reserva reserva) {
        Recordatorio recordatorio = new Recordatorio();
        recordatorio.setReserva(reserva);
        try {
            var servicio = reserva.getFranja().getServicio();
            String cuerpo = "Tienes una cita de " + servicio.getNombre() + " el "
                    + FORMATO.format(reserva.getFranja().getInicio()) + ".";
            emailService.enviarCorreo(reserva.getCliente().getCorreo(), "Recordatorio de tu reserva", cuerpo);
            recordatorio.setEnviado(true);
            recordatorio.setFechaEnvio(Instant.now());
        } catch (Exception e) {
            // La reserva permanece válida: solo registramos el error del envío.
            log.warn("No se pudo enviar el recordatorio de la reserva {}: {}", reserva.getId(), e.getMessage());
            recordatorio.setEnviado(false);
            recordatorio.setError(e.getMessage());
        }
        recordatorios.saveAndFlush(recordatorio);
    }
}
