package com.fabricaescuela.reservas;

import com.fabricaescuela.reservas.domain.TokenRecuperacion;
import com.fabricaescuela.reservas.repository.TokenRecuperacionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pruebas de aceptación del Sprint 2: HU03, HU04, HU06 (eliminar), HU12, HU16 y HU18. */
class ReservasSprint2Tests extends PruebasBase {

    private static final ZoneId ZONA = ZoneId.of("America/Bogota");

    @Autowired
    private TokenRecuperacionRepository tokens;

    // ---------------------------------------------------------------- HU03 Actualizar perfil

    @Test
    void hu03_datosValidos_actualizaElPerfil() throws Exception {
        String token = registrarYLogin("CLIENTE");
        String nuevoCorreo = correoUnico();

        enviar(put("/api/usuarios/me"),
                mapa("nombre", "Nuevo Nombre", "correo", nuevoCorreo, "telefono", "3001234567"), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Nuevo Nombre"))
                .andExpect(jsonPath("$.correo").value(nuevoCorreo))
                .andExpect(jsonPath("$.telefono").value("3001234567"));

        consultar(get("/api/usuarios/me"), token)
                .andExpect(jsonPath("$.correo").value(nuevoCorreo));
    }

    @Test
    void hu03_sinCamposObligatorios_pideCompletarlos() throws Exception {
        String token = registrarYLogin("CLIENTE");
        enviar(put("/api/usuarios/me"), mapa("nombre", "", "correo", ""), token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombre").exists())
                .andExpect(jsonPath("$.errores.correo").exists());
    }

    @Test
    void hu03_correoYaUsadoPorOtraCuenta_seRechaza() throws Exception {
        Sesion existente = registrarYLoginSesion("CLIENTE");
        String token = registrarYLogin("CLIENTE");

        enviar(put("/api/usuarios/me"),
                mapa("nombre", "Usuario de prueba", "correo", existente.correo(), "telefono", ""), token)
                .andExpect(status().isConflict());
    }

    // ---------------------------------------------------------------- HU04 Recuperar acceso

    @Test
    void hu04_correoRegistrado_generaUnTokenValidoYPermiteRestablecer() throws Exception {
        Sesion sesion = registrarYLoginSesion("CLIENTE");

        enviar(post("/api/auth/recuperar"), mapa("correo", sesion.correo()), null)
                .andExpect(status().isOk());

        String token = ultimoTokenDe(sesion.correo());

        enviar(post("/api/auth/restablecer"),
                mapa("token", token, "nuevaContrasena", "ClaveNueva1", "confirmarContrasena", "ClaveNueva1"), null)
                .andExpect(status().isOk());

        // la contraseña anterior ya no sirve, la nueva sí
        enviar(post("/api/auth/login"), mapa("correo", sesion.correo(), "contrasena", "Clave1234"), null)
                .andExpect(status().isUnauthorized());
        enviar(post("/api/auth/login"), mapa("correo", sesion.correo(), "contrasena", "ClaveNueva1"), null)
                .andExpect(status().isOk());
    }

    @Test
    void hu04_correoNoRegistrado_noIniciaElProceso() throws Exception {
        enviar(post("/api/auth/recuperar"), mapa("correo", correoUnico()), null)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.mensaje").exists());
    }

    @Test
    void hu04_enlaceInvalidoOExpirado_noPermiteCambiarLaContrasena() throws Exception {
        enviar(post("/api/auth/restablecer"),
                mapa("token", "token-inventado-que-no-existe", "nuevaContrasena", "ClaveNueva1",
                        "confirmarContrasena", "ClaveNueva1"), null)
                .andExpect(status().isBadRequest());
    }

    @Test
    void hu04_confirmacionQueNoCoincide_seRechaza() throws Exception {
        Sesion sesion = registrarYLoginSesion("CLIENTE");
        enviar(post("/api/auth/recuperar"), mapa("correo", sesion.correo()), null).andExpect(status().isOk());
        String token = ultimoTokenDe(sesion.correo());

        enviar(post("/api/auth/restablecer"),
                mapa("token", token, "nuevaContrasena", "ClaveNueva1", "confirmarContrasena", "OtraClave1"), null)
                .andExpect(status().isBadRequest());
    }

    private String ultimoTokenDe(String correo) {
         Optional<TokenRecuperacion> encontrado = tokens.findFirstByUsuario_CorreoOrderByIdDesc(correo);
         assertTrue(encontrado.isPresent(), "No se generó el token de recuperación para " + correo);
         return encontrado.get().getToken();
    }

    // ---------------------------------------------------------------- HU06 Eliminar servicio

    @Test
    void hu06_servicioPropioSinReservas_sePuedeEliminar() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);

        consultar(delete("/api/servicios/" + servicioId), proveedor).andExpect(status().isNoContent());

        consultar(get("/api/servicios/mis-servicios"), proveedor)
                .andExpect(jsonPath("$[0].estado").value("ELIMINADO"));

        enviar(put("/api/servicios/" + servicioId), servicioValido(), proveedor)
                .andExpect(status().isConflict());
    }

    @Test
    void hu06_servicioAjeno_niegaLaEliminacion() throws Exception {
        String duenio = registrarYLogin("PROVEEDOR");
        String otro = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(duenio);

        consultar(delete("/api/servicios/" + servicioId), otro).andExpect(status().isForbidden());
    }

    @Test
    void hu06_servicioConReservaVigente_protegeLaEliminacion() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        reservar(cliente, publicarFranja(proveedor, servicioId, 1));

        consultar(delete("/api/servicios/" + servicioId), proveedor).andExpect(status().isConflict());
    }

    // ---------------------------------------------------------------- HU12 Repetir horarios

    @Test
    void hu12_patronSemanalValido_creaLasOcurrenciasFuturas() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);
        LocalDate manana = LocalDate.now(ZONA).plusDays(2);

        enviar(post("/api/servicios/" + servicioId + "/franjas/recurrentes"),
                mapa("horaInicio", "09:00:00", "horaFin", "10:00:00",
                        "diasSemana", List.of(manana.getDayOfWeek().name()),
                        "repetirHasta", manana.plusDays(7).toString(),
                        "cupoTotal", 2),
                proveedor)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$").isNotEmpty())
                .andExpect(jsonPath("$[0].cupoTotal").value(2));

        consultar(get("/api/servicios/" + servicioId + "/franjas"), proveedor)
                .andExpect(jsonPath("$.length()").value(2)); // la fecha "manana" y la misma, 7 días después
    }

    @Test
    void hu12_reglaIncompleta_pideCorregirla() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);

        // sin días de la semana seleccionados
        enviar(post("/api/servicios/" + servicioId + "/franjas/recurrentes"),
                mapa("horaInicio", "09:00:00", "horaFin", "10:00:00",
                        "diasSemana", List.of(),
                        "repetirHasta", LocalDate.now(ZONA).plusDays(10).toString()),
                proveedor)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.diasSemana").exists());

        // hora de fin antes que la de inicio
        enviar(post("/api/servicios/" + servicioId + "/franjas/recurrentes"),
                mapa("horaInicio", "10:00:00", "horaFin", "09:00:00",
                        "diasSemana", List.of("MONDAY"),
                        "repetirHasta", LocalDate.now(ZONA).plusDays(10).toString()),
                proveedor)
                .andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------- HU16 Reprogramar reserva

    @Test
    void hu16_nuevoCupoLibre_liberaElHorarioAnterior() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaOriginal = publicarFranja(proveedor, servicioId, 1);
        long franjaNueva = publicarFranja(proveedor, servicioId, 1);
        long reservaId = reservar(cliente, franjaOriginal);

        enviar(put("/api/reservas/" + reservaId + "/reprogramar"), mapa("nuevaFranjaId", franjaNueva), cliente)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.franjaId").value(franjaNueva));

        String respuesta = consultar(get("/api/servicios/" + servicioId + "/franjas"), proveedor)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        for (com.fasterxml.jackson.databind.JsonNode f : om.readTree(respuesta)) {
            if (f.get("id").asLong() == franjaOriginal) {
                assertEquals(1, f.get("cuposDisponibles").asInt());
            } else if (f.get("id").asLong() == franjaNueva) {
                assertEquals(0, f.get("cuposDisponibles").asInt());
            }
        }
    }

    @Test
    void hu16_horarioOcupado_laReservaOriginalPermaneceIntacta() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        String otroCliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaOriginal = publicarFranja(proveedor, servicioId, 1);
        long franjaLlena = publicarFranja(proveedor, servicioId, 1);
        long reservaId = reservar(cliente, franjaOriginal);
        reservar(otroCliente, franjaLlena); // deja franjaLlena sin cupo

        enviar(put("/api/reservas/" + reservaId + "/reprogramar"), mapa("nuevaFranjaId", franjaLlena), cliente)
                .andExpect(status().isConflict());

        consultar(get("/api/agenda"), cliente)
                .andExpect(jsonPath("$[0].franjaId").value(franjaOriginal));
    }

    // ---------------------------------------------------------------- HU18 Filtrar agenda

    @Test
    void hu18_filtroPorServicio_soloMuestraCoincidencias() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioA = crearServicio(proveedor);
        long servicioB = crearServicio(proveedor);
        reservar(cliente, publicarFranja(proveedor, servicioA, 1));
        reservar(cliente, publicarFranja(proveedor, servicioB, 1));

        consultar(get("/api/agenda?servicioId=" + servicioA), cliente)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].servicioId").value(servicioA));
    }

    @Test
    void hu18_sinCoincidencias_laListaVieneVacia() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioA = crearServicio(proveedor);
        long servicioB = crearServicio(proveedor); // sin ninguna reserva
        reservar(cliente, publicarFranja(proveedor, servicioA, 1));

        consultar(get("/api/agenda?servicioId=" + servicioB), cliente)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void hu18_filtroPorFecha_soloMuestraLaDeEseDia() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);

        LocalDate diaA = LocalDate.now(ZONA).plusDays(3);
        LocalDate diaB = LocalDate.now(ZONA).plusDays(4);
        long franjaDiaA = publicarFranjaEnFecha(proveedor, servicioId, diaA, LocalTime.of(9, 0));
        long franjaDiaB = publicarFranjaEnFecha(proveedor, servicioId, diaB, LocalTime.of(9, 0));
        reservar(cliente, franjaDiaA);
        reservar(cliente, franjaDiaB);

        consultar(get("/api/agenda?fecha=" + diaA), cliente)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].franjaId").value(franjaDiaA));
    }

    private long publicarFranjaEnFecha(String tokenProveedor, long servicioId, LocalDate fecha, LocalTime hora) throws Exception {
        OffsetDateTime inicio = fecha.atTime(hora).atZone(ZONA).toOffsetDateTime();
        String respuesta = enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", inicio.toString(), "fin", inicio.plusHours(1).toString(), "cupoTotal", 1),
                tokenProveedor)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(respuesta).get("id").asLong();
    }
}
