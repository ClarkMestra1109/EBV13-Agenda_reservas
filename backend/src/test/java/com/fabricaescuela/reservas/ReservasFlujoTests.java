package com.fabricaescuela.reservas;

import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pruebas de aceptación de HU10, HU11, HU14, HU15 y HU17. */
class ReservasFlujoTests extends PruebasBase {

    // ---------------------------------------------------------------- HU10 Publicar disponibilidad

    @Test
    void hu10_franjaFuturaValida_quedaVisibleComoDisponible() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaId = publicarFranja(proveedor, servicioId, 2);

        consultar(get("/api/catalogo/servicios/" + servicioId + "/franjas"), cliente)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(franjaId))
                .andExpect(jsonPath("$[0].estado").value("PUBLICADA"))
                .andExpect(jsonPath("$[0].cuposDisponibles").value(2));
    }

    @Test
    void hu10_rangoInvalido_seRechaza() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);
        OffsetDateTime inicio = OffsetDateTime.now(ZoneOffset.UTC).plusDays(2);

        // el fin es anterior al inicio
        enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", inicio.toString(), "fin", inicio.minusHours(1).toString()), proveedor)
                .andExpect(status().isBadRequest());

        // la franja ya pasó
        OffsetDateTime pasado = OffsetDateTime.now(ZoneOffset.UTC).minusDays(1);
        enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", pasado.toString(), "fin", pasado.plusHours(1).toString()), proveedor)
                .andExpect(status().isBadRequest());

        // faltan las fechas
        enviar(post("/api/servicios/" + servicioId + "/franjas"), mapa(), proveedor)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.inicio").exists())
                .andExpect(jsonPath("$.errores.fin").exists());
    }

    @Test
    void hu10_noSePuedePublicarEnUnServicioAjeno() throws Exception {
        String duenio = registrarYLogin("PROVEEDOR");
        String otro = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(duenio);
        OffsetDateTime inicio = OffsetDateTime.now(ZoneOffset.UTC).plusDays(2);
        enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", inicio.toString(), "fin", inicio.plusHours(1).toString()), otro)
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- HU11 Retirar disponibilidad

    @Test
    void hu11_franjaFuturaSinReserva_dejaDeOfrecerse() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaId = publicarFranja(proveedor, servicioId, 1);

        consultar(delete("/api/franjas/" + franjaId), proveedor)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("RETIRADA"));

        consultar(get("/api/catalogo/servicios/" + servicioId + "/franjas"), cliente)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void hu11_franjaOcupada_protegeLaReservaExistente() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long franjaId = publicarFranja(proveedor, crearServicio(proveedor), 1);
        reservar(cliente, franjaId);

        consultar(delete("/api/franjas/" + franjaId), proveedor)
                .andExpect(status().isConflict());

        consultar(get("/api/agenda"), cliente)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].franjaId").value(franjaId));
    }

    // ---------------------------------------------------------------- HU14 Confirmar reserva

    @Test
    void hu14_franjaDisponible_creaLaReservaYOcupaElCupo() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaId = publicarFranja(proveedor, servicioId, 2);

        enviar(post("/api/reservas"), mapa("franjaId", franjaId), cliente)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("CONFIRMADA"))
                .andExpect(jsonPath("$.franjaId").value(franjaId));

        consultar(get("/api/servicios/" + servicioId + "/franjas"), proveedor)
                .andExpect(jsonPath("$[0].cuposOcupados").value(1))
                .andExpect(jsonPath("$[0].cuposDisponibles").value(1));
    }

    @Test
    void hu14_ultimoCupo_laSegundaSolicitudEsRechazada() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String clienteA = registrarYLogin("CLIENTE");
        String clienteB = registrarYLogin("CLIENTE");
        long franjaId = publicarFranja(proveedor, crearServicio(proveedor), 1);

        reservar(clienteA, franjaId);
        enviar(post("/api/reservas"), mapa("franjaId", franjaId), clienteB)
                .andExpect(status().isConflict());
    }

    @Test
    void hu14_cincoSolicitudesSimultaneasPorElUltimoCupo_soloUnaSeConfirma() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long franjaId = publicarFranja(proveedor, crearServicio(proveedor), 1);
        int solicitantes = 5;
        List<String> tokens = new ArrayList<>();
        for (int i = 0; i < solicitantes; i++) {
            tokens.add(registrarYLogin("CLIENTE"));
        }

        ExecutorService hilos = Executors.newFixedThreadPool(solicitantes);
        CountDownLatch salida = new CountDownLatch(1);
        List<Future<Integer>> resultados = new ArrayList<>();
        for (String token : tokens) {
            resultados.add(hilos.submit(() -> {
                salida.await();
                return enviar(post("/api/reservas"), mapa("franjaId", franjaId), token)
                        .andReturn().getResponse().getStatus();
            }));
        }
        salida.countDown();

        int confirmadas = 0;
        int rechazadas = 0;
        for (Future<Integer> resultado : resultados) {
            int codigo = resultado.get(60, TimeUnit.SECONDS);
            if (codigo == 201) {
                confirmadas++;
            } else if (codigo == 409) {
                rechazadas++;
            }
        }
        hilos.shutdown();

        assertEquals(1, confirmadas);
        assertEquals(solicitantes - 1, rechazadas);
    }

    @Test
    void hu14_unProveedorNoPuedeReservar() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long franjaId = publicarFranja(proveedor, crearServicio(proveedor), 1);
        enviar(post("/api/reservas"), mapa("franjaId", franjaId), proveedor)
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- HU15 Cancelar reserva

    @Test
    void hu15_reservaFuturaPropia_quedaCanceladaYElCupoVuelveADisponible() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaId = publicarFranja(proveedor, servicioId, 1);
        long reservaId = reservar(cliente, franjaId);

        consultar(put("/api/reservas/" + reservaId + "/cancelar"), cliente)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADA"));

        consultar(get("/api/catalogo/servicios/" + servicioId + "/franjas"), cliente)
                .andExpect(jsonPath("$[0].id").value(franjaId))
                .andExpect(jsonPath("$[0].cuposDisponibles").value(1));
    }

    @Test
    void hu15_reservaAjena_niegaLaCancelacion() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String duenio = registrarYLogin("CLIENTE");
        String otro = registrarYLogin("CLIENTE");
        long reservaId = reservar(duenio, publicarFranja(proveedor, crearServicio(proveedor), 1));

        consultar(put("/api/reservas/" + reservaId + "/cancelar"), otro)
                .andExpect(status().isForbidden());
    }

    @Test
    void hu15_cancelarDosVeces_noLiberaElCupoDosVeces() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long reservaId = reservar(cliente, publicarFranja(proveedor, servicioId, 2));

        consultar(put("/api/reservas/" + reservaId + "/cancelar"), cliente).andExpect(status().isOk());
        consultar(put("/api/reservas/" + reservaId + "/cancelar"), cliente).andExpect(status().isConflict());

        consultar(get("/api/servicios/" + servicioId + "/franjas"), proveedor)
                .andExpect(jsonPath("$[0].cuposOcupados").value(0));
    }

    // ---------------------------------------------------------------- HU17 Consultar agenda

    @Test
    void hu17_clienteVeSusReservasVigentes() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        String otroCliente = registrarYLogin("CLIENTE");
        long reservaId = reservar(cliente, publicarFranja(proveedor, crearServicio(proveedor), 2));

        consultar(get("/api/agenda"), cliente)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(reservaId))
                .andExpect(jsonPath("$.length()").value(1));

        consultar(get("/api/agenda"), otroCliente)
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void hu17_proveedorVeLasReservasDeSusServiciosYNoLasAjenas() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String otroProveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long reservaId = reservar(cliente, publicarFranja(proveedor, crearServicio(proveedor), 2));

        consultar(get("/api/agenda"), proveedor)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(reservaId));

        consultar(get("/api/agenda"), otroProveedor)
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void hu17_reservaCancelada_yaNoApareceEnLaAgenda() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long reservaId = reservar(cliente, publicarFranja(proveedor, crearServicio(proveedor), 1));
        consultar(put("/api/reservas/" + reservaId + "/cancelar"), cliente).andExpect(status().isOk());

        consultar(get("/api/agenda"), cliente).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void hu17_sinSesion_pideIniciarSesion() throws Exception {
        consultar(get("/api/agenda"), null).andExpect(status().isUnauthorized());
    }
}
