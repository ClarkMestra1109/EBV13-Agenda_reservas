package com.fabricaescuela.reservas;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Sprint 3: recursos (HU07, HU08, HU09) e informes (HU20, HU21, HU22). */
class ReservasSprint3Tests extends PruebasBase {

    private static final ZoneId ZONA = ZoneId.of("America/Bogota");

    private Map<String, Object> recursoValido(String nombre, int capacidad) {
        return mapa("nombre", nombre, "tipo", "ESPACIO", "descripcion", "Cabina de atención", "capacidad", capacidad);
    }

    private long crearRecurso(String token, String nombre, int capacidad) throws Exception {
        String respuesta = enviar(post("/api/recursos"), recursoValido(nombre, capacidad), token)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(respuesta).get("id").asLong();
    }

    private void asociar(String token, long servicioId, long recursoId) throws Exception {
        consultar(post("/api/servicios/" + servicioId + "/recursos/" + recursoId), token)
                .andExpect(status().isCreated());
    }

    /** Un instante en un día lejano y propio de cada prueba, para no cruzarse con otras franjas. */
    private OffsetDateTime en(int dias, int hora) {
        return OffsetDateTime.now(ZoneOffset.UTC).plusDays(dias)
                .withHour(hora).withMinute(0).withSecond(0).withNano(0);
    }

    // ------------------------------------------------------------------ HU07 Registrar recurso

    @Test
    void hu07_recursoValido_quedaCreadoYApareceEnElListado() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long id = crearRecurso(proveedor, "Silla 1", 1);
        consultar(get("/api/recursos"), proveedor)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].nombre").value("Silla 1"))
                .andExpect(jsonPath("$[0].capacidad").value(1));
    }

    @Test
    void hu07_datosIncompletos_indicaLosCamposFaltantes() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        enviar(post("/api/recursos"), mapa("descripcion", "sin nombre"), proveedor)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombre").exists())
                .andExpect(jsonPath("$.errores.tipo").exists())
                .andExpect(jsonPath("$.errores.capacidad").exists());
        consultar(get("/api/recursos"), proveedor).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void hu07_datosInvalidos_noCreanElRecurso() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        enviar(post("/api/recursos"), recursoValido("Sala", 0), proveedor)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.capacidad").exists());
        enviar(post("/api/recursos"), mapa("nombre", "Sala", "tipo", "NAVE_ESPACIAL", "capacidad", 2), proveedor)
                .andExpect(status().isBadRequest());
        crearRecurso(proveedor, "Sala", 2);
        enviar(post("/api/recursos"), recursoValido("SALA", 3), proveedor).andExpect(status().isConflict());
        consultar(get("/api/recursos"), proveedor).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void hu07_sinSesion_seNiegaLaOperacion() throws Exception {
        enviar(post("/api/recursos"), recursoValido("Sala", 1), null).andExpect(status().isUnauthorized());
        // un cliente tampoco puede registrar recursos
        enviar(post("/api/recursos"), recursoValido("Sala", 1), registrarYLogin("CLIENTE"))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------ HU08 Asociar recurso

    @Test
    void hu08_asociarDesasociarYEvitarDuplicados() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);
        long recursoId = crearRecurso(proveedor, "Silla", 1);

        asociar(proveedor, servicioId, recursoId);
        consultar(get("/api/servicios/" + servicioId + "/recursos"), proveedor)
                .andExpect(jsonPath("$[0].id").value(recursoId));
        consultar(post("/api/servicios/" + servicioId + "/recursos/" + recursoId), proveedor)
                .andExpect(status().isConflict());

        consultar(delete("/api/servicios/" + servicioId + "/recursos/" + recursoId), proveedor)
                .andExpect(status().isNoContent());
        consultar(get("/api/servicios/" + servicioId + "/recursos"), proveedor)
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void hu08_recursoOServicioAjeno_seRechaza() throws Exception {
        String proveedorA = registrarYLogin("PROVEEDOR");
        String proveedorB = registrarYLogin("PROVEEDOR");
        long servicioA = crearServicio(proveedorA);
        long recursoA = crearRecurso(proveedorA, "Silla A", 1);
        long servicioB = crearServicio(proveedorB);
        long recursoB = crearRecurso(proveedorB, "Silla B", 1);

        // recurso ajeno en servicio propio
        consultar(post("/api/servicios/" + servicioA + "/recursos/" + recursoB), proveedorA)
                .andExpect(status().isForbidden());
        // recurso propio en servicio ajeno
        consultar(post("/api/servicios/" + servicioB + "/recursos/" + recursoA), proveedorA)
                .andExpect(status().isForbidden());
        consultar(get("/api/servicios/" + servicioA + "/recursos"), proveedorA)
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void hu08_recursoAsociado_noSePuedeEliminarHastaDesasociarlo() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);
        long recursoId = crearRecurso(proveedor, "Equipo", 1);
        asociar(proveedor, servicioId, recursoId);

        consultar(delete("/api/recursos/" + recursoId), proveedor).andExpect(status().isConflict());
        consultar(delete("/api/servicios/" + servicioId + "/recursos/" + recursoId), proveedor)
                .andExpect(status().isNoContent());
        consultar(delete("/api/recursos/" + recursoId), proveedor).andExpect(status().isNoContent());
    }

    // ------------------------------------------------------------------ HU09 Capacidad

    @Test
    void hu09_recursoLleno_rechazaReservasEnElMismoHorarioAunqueSeanDeOtroServicio() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long corte = crearServicio(proveedor, "Corte");
        long barba = crearServicio(proveedor, "Barba");
        long silla = crearRecurso(proveedor, "Silla", 1);
        asociar(proveedor, corte, silla);
        asociar(proveedor, barba, silla);

        OffsetDateTime inicio = en(40, 15);
        long franjaCorte = publicarFranjaEn(proveedor, corte, inicio, 5);
        long franjaBarba = publicarFranjaEn(proveedor, barba, inicio.plusMinutes(30), 5);

        reservar(registrarYLogin("CLIENTE"), franjaCorte);
        // la franja de barba tiene cupos, pero la única silla está ocupada en ese horario
        enviar(post("/api/reservas"), mapa("franjaId", franjaBarba), registrarYLogin("CLIENTE"))
                .andExpect(status().isConflict());
        // y el catálogo ya no ofrece ese horario
        consultar(get("/api/catalogo/servicios/" + barba + "/franjas"), registrarYLogin("CLIENTE"))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void hu09_cancelarLiberaElCupoYAumentarLaCapacidadAbreCuposNuevos() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);
        long recursoId = crearRecurso(proveedor, "Cabina", 1);
        asociar(proveedor, servicioId, recursoId);
        long franjaId = publicarFranjaEn(proveedor, servicioId, en(41, 15), 3);

        String clienteA = registrarYLogin("CLIENTE");
        String clienteB = registrarYLogin("CLIENTE");
        String clienteC = registrarYLogin("CLIENTE");
        long reservaA = reservar(clienteA, franjaId);
        enviar(post("/api/reservas"), mapa("franjaId", franjaId), clienteB).andExpect(status().isConflict());

        // cancelar devuelve el cupo del recurso
        consultar(put("/api/reservas/" + reservaA + "/cancelar"), clienteA).andExpect(status().isOk());
        reservar(clienteB, franjaId);

        // aumentar la capacidad abre un cupo más
        enviar(put("/api/recursos/" + recursoId), recursoValido("Cabina", 2), proveedor)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.capacidad").value(2))
                .andExpect(jsonPath("$.cuposLibresEnPico").value(1));
        reservar(clienteC, franjaId);
    }

    @Test
    void hu09_noSePuedeReducirLaCapacidadPorDebajoDeLasReservasTomadas() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);
        long recursoId = crearRecurso(proveedor, "Sala", 2);
        asociar(proveedor, servicioId, recursoId);
        long franjaId = publicarFranjaEn(proveedor, servicioId, en(42, 15), 2);
        reservar(registrarYLogin("CLIENTE"), franjaId);
        reservar(registrarYLogin("CLIENTE"), franjaId);

        enviar(put("/api/recursos/" + recursoId), recursoValido("Sala", 1), proveedor)
                .andExpect(status().isConflict());

        String hoyMas42 = LocalDate.now(ZONA).plusDays(42).toString();
        JsonNode disponibilidad = om.readTree(consultar(
                get("/api/recursos/" + recursoId + "/disponibilidad?fecha=" + hoyMas42), proveedor)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        // si la franja cae en el día consultado, el recurso aparece sin cupos libres
        if (disponibilidad.get("horarios").size() > 0) {
            assertThat(disponibilidad.get("horarios").get(0).get("cuposDisponibles").asInt()).isZero();
        }
    }

    @Test
    void hu09_asociarUnRecursoQueSeDesbordaria_seRechaza() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);
        long franjaId = publicarFranjaEn(proveedor, servicioId, en(43, 15), 3);
        reservar(registrarYLogin("CLIENTE"), franjaId);
        reservar(registrarYLogin("CLIENTE"), franjaId);

        long recursoId = crearRecurso(proveedor, "Mesa", 1);
        consultar(post("/api/servicios/" + servicioId + "/recursos/" + recursoId), proveedor)
                .andExpect(status().isConflict());
        consultar(get("/api/servicios/" + servicioId + "/recursos"), proveedor)
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ------------------------------------------------------------------ HU20 / HU21 / HU22 Informes

    @Test
    void informes_cuentanSoloLoDelProveedorIncluyenLosExtremosYCalculanLaOcupacion() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String otro = registrarYLogin("PROVEEDOR");
        long corte = crearServicio(proveedor, "Corte");
        long barba = crearServicio(proveedor, "Barba");
        long ajeno = crearServicio(otro, "Corte");

        LocalDate dia1 = LocalDate.now(ZONA).plusDays(50);
        LocalDate dia2 = dia1.plusDays(3);
        long f1 = publicarFranjaEn(proveedor, corte, dia1.atTime(10, 0).atZone(ZONA).toOffsetDateTime(), 2);
        long f2 = publicarFranjaEn(proveedor, barba, dia2.atTime(18, 0).atZone(ZONA).toOffsetDateTime(), 2);
        long fAjena = publicarFranjaEn(otro, ajeno, dia1.atTime(12, 0).atZone(ZONA).toOffsetDateTime(), 1);

        reservar(registrarYLogin("CLIENTE"), f1);
        reservar(registrarYLogin("CLIENTE"), f2);
        String clienteC = registrarYLogin("CLIENTE");
        long cancelada = reservar(clienteC, f2);
        consultar(put("/api/reservas/" + cancelada + "/cancelar"), clienteC).andExpect(status().isOk());
        reservar(registrarYLogin("CLIENTE"), fAjena);

        // HU20 + HU21: el periodo exacto [dia1, dia2] incluye ambos extremos
        consultar(get("/api/informes?desde=" + dia1 + "&hasta=" + dia2), proveedor)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumen.reservas").value(2))
                .andExpect(jsonPath("$.resumen.canceladas").value(1))
                .andExpect(jsonPath("$.resumen.cuposPublicados").value(4))
                .andExpect(jsonPath("$.resumen.cuposReservados").value(2))
                .andExpect(jsonPath("$.resumen.cuposDisponibles").value(2))
                .andExpect(jsonPath("$.resumen.porcentajeOcupacion").value(50.0))
                .andExpect(jsonPath("$.reservas.length()").value(3));

        // HU22: filtro por servicio
        consultar(get("/api/informes?desde=" + dia1 + "&hasta=" + dia2 + "&servicioId=" + barba), proveedor)
                .andExpect(jsonPath("$.resumen.reservas").value(1))
                .andExpect(jsonPath("$.resumen.cuposPublicados").value(2))
                .andExpect(jsonPath("$.servicio").value("Barba"));

        // HU20: cambiar el periodo actualiza el resultado (solo el primer día)
        consultar(get("/api/informes?desde=" + dia1 + "&hasta=" + dia1), proveedor)
                .andExpect(jsonPath("$.resumen.reservas").value(1));
    }

    @Test
    void informes_periodoSinDatos_rangoInvalidoYServicioAjeno() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long ajeno = crearServicio(registrarYLogin("PROVEEDOR"));
        LocalDate desde = LocalDate.now(ZONA).plusDays(200);

        consultar(get("/api/informes?desde=" + desde + "&hasta=" + desde.plusDays(5)), proveedor)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumen.reservas").value(0))
                .andExpect(jsonPath("$.resumen.porcentajeOcupacion").doesNotExist())
                .andExpect(jsonPath("$.reservas.length()").value(0));

        consultar(get("/api/informes?desde=" + desde + "&hasta=" + desde.minusDays(1)), proveedor)
                .andExpect(status().isBadRequest());
        consultar(get("/api/informes?desde=" + desde), proveedor).andExpect(status().isBadRequest());
        consultar(get("/api/informes?desde=" + desde + "&hasta=" + desde + "&servicioId=" + ajeno), proveedor)
                .andExpect(status().isForbidden());
        consultar(get("/api/informes?desde=" + desde + "&hasta=" + desde), registrarYLogin("CLIENTE"))
                .andExpect(status().isForbidden());
    }
}
