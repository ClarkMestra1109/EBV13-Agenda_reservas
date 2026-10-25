package com.fabricaescuela.reservas;

import com.fabricaescuela.reservas.domain.Recordatorio;
import com.fabricaescuela.reservas.repository.RecordatorioRepository;
import com.fabricaescuela.reservas.service.RecordatorioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HU19: la tarea de recordatorios se invoca directamente (no está expuesta por REST, se
 * dispara sola con @Scheduled); aquí se prueba su lógica de negocio de forma aislada.
 */
class ReservasRecordatorioTests extends PruebasBase {

    @Autowired
    private RecordatorioService recordatorioService;

    @Autowired
    private RecordatorioRepository recordatorios;

    @Test
    void hu19_reservaDentroDeLaVentana_generaUnRecordatorioEnviado() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaId = publicarFranjaEnDosHoras(proveedor, servicioId);
        long reservaId = reservar(cliente, franjaId);

        recordatorioService.generarRecordatorios();

        Optional<Recordatorio> generado = recordatorios.findAll().stream()
                .filter(r -> r.getReserva().getId().equals(reservaId))
                .findFirst();
        assertTrue(generado.isPresent(), "Debió generarse un recordatorio para la reserva");
        assertTrue(generado.get().isEnviado());
        assertEquals(null, generado.get().getError());
    }

    @Test
    void hu19_yaTieneRecordatorio_noGeneraUnoDuplicadoAlEjecutarseOtraVez() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaId = publicarFranjaEnDosHoras(proveedor, servicioId);
        long reservaId = reservar(cliente, franjaId);

        recordatorioService.generarRecordatorios();
        recordatorioService.generarRecordatorios();

        long cantidad = recordatorios.findAll().stream()
                .filter(r -> r.getReserva().getId().equals(reservaId))
                .count();
        assertEquals(1, cantidad);
    }

    @Test
    void hu19_reservaFueraDeLaVentana_noGeneraRecordatorioTodavia() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaId = publicarFranja(proveedor, servicioId, 1); // +2 días, fuera de la ventana de 24h
        long reservaId = reservar(cliente, franjaId);

        recordatorioService.generarRecordatorios();

        boolean existe = recordatorios.findAll().stream()
                .anyMatch(r -> r.getReserva().getId().equals(reservaId));
        assertTrue(!existe, "No debía generarse un recordatorio fuera de la ventana configurada");
    }

    private long publicarFranjaEnDosHoras(String tokenProveedor, long servicioId) throws Exception {
        OffsetDateTime inicio = OffsetDateTime.now(ZoneOffset.UTC).plusHours(2);
        String respuesta = enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", inicio.toString(), "fin", inicio.plusHours(1).toString(), "cupoTotal", 1),
                tokenProveedor)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(respuesta).get("id").asLong();
    }
}
