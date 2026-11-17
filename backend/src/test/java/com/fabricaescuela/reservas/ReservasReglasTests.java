package com.fabricaescuela.reservas;

import com.fabricaescuela.reservas.domain.TokenRecuperacion;
import com.fabricaescuela.reservas.repository.TokenRecuperacionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reglas de negocio y de seguridad añadidas tras la retroalimentación del Sprint 2:
 * validaciones de fechas, precios, cruces de horario, estado del servicio y límites de intentos.
 */
class ReservasReglasTests extends PruebasBase {

    private static final ZoneId ZONA = ZoneId.of("America/Bogota");

    @Autowired
    private TokenRecuperacionRepository tokens;

    /** Un instante lejano y único por prueba, fuera del rango que usa publicarFranja. */
    private OffsetDateTime en(int dias, int hora) {
        return OffsetDateTime.now(ZoneOffset.UTC).plusDays(dias)
                .withHour(hora).withMinute(0).withSecond(0).withNano(0);
    }

    // ---------------------------------------------------------------- Horarios del proveedor

    @Test
    void horarioQueSeCruzaConOtroDelMismoServicio_seRechaza() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);
        OffsetDateTime inicio = en(30, 10);
        publicarFranjaEn(proveedor, servicioId, inicio, 1);

        // mismo horario exacto
        enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", inicio.toString(), "fin", inicio.plusHours(1).toString()), proveedor)
                .andExpect(status().isConflict());
        // cruce parcial (empieza media hora después)
        enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", inicio.plusMinutes(30).toString(), "fin", inicio.plusMinutes(90).toString()), proveedor)
                .andExpect(status().isConflict());
        // contiguo (empieza justo cuando termina el otro): sí se permite
        enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", inicio.plusHours(1).toString(), "fin", inicio.plusHours(2).toString()), proveedor)
                .andExpect(status().isCreated());
    }

    @Test
    void horarioMasCortoQueLaDuracionDelServicio_seRechaza() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor); // dura 30 minutos
        OffsetDateTime inicio = en(31, 10);
        enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", inicio.toString(), "fin", inicio.plusMinutes(10).toString()), proveedor)
                .andExpect(status().isBadRequest());
    }

    @Test
    void horarioDemasiadoLargoODemasiadoLejano_seRechaza() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);
        OffsetDateTime inicio = en(32, 6);
        enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", inicio.toString(), "fin", inicio.plusHours(13).toString()), proveedor)
                .andExpect(status().isBadRequest());

        OffsetDateTime lejano = OffsetDateTime.now(ZoneOffset.UTC).plusMonths(7);
        enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", lejano.toString(), "fin", lejano.plusHours(1).toString()), proveedor)
                .andExpect(status().isBadRequest());
    }

    @Test
    void repeticionSemanalDeMasDeTresMeses_seRechaza() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long servicioId = crearServicio(proveedor);
        enviar(post("/api/servicios/" + servicioId + "/franjas/recurrentes"),
                mapa("horaInicio", "09:00", "horaFin", "10:00",
                        "diasSemana", List.of("MONDAY"),
                        "repetirHasta", LocalDate.now(ZONA).plusYears(5).toString(),
                        "cupoTotal", 1),
                proveedor)
                .andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------- Servicios

    @Test
    void nombreDeServicioRepetidoParaElMismoProveedor_seRechaza() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        crearServicio(proveedor);
        Map<String, Object> repetido = servicioValido();
        repetido.put("nombre", "corte de CABELLO"); // no distingue mayúsculas
        enviar(post("/api/servicios"), repetido, proveedor).andExpect(status().isConflict());

        // otro proveedor sí puede usar el mismo nombre
        crearServicio(registrarYLogin("PROVEEDOR"));
    }

    @Test
    void precioConDecimalesEsValidoYFueraDeRangoSeRechaza() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        Map<String, Object> cuerpo = servicioValido();
        cuerpo.put("precio", 35000.50);
        enviar(post("/api/servicios"), cuerpo, proveedor).andExpect(status().isCreated());

        cuerpo.put("nombre", "Servicio carísimo");
        cuerpo.put("precio", 50000001);
        enviar(post("/api/servicios"), cuerpo, proveedor)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.precio").exists());

        cuerpo.put("precio", -1);
        enviar(post("/api/servicios"), cuerpo, proveedor)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.precio").exists());
    }

    @Test
    void servicioDesactivado_noAdmiteReservasNuevas() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaId = publicarFranja(proveedor, servicioId, 2);

        Map<String, Object> cambios = servicioValido();
        cambios.put("estado", "INACTIVO");
        enviar(put("/api/servicios/" + servicioId), cambios, proveedor).andExpect(status().isOk());

        enviar(post("/api/reservas"), mapa("franjaId", franjaId), cliente).andExpect(status().isConflict());
    }

    @Test
    void servicioEliminado_retiraSusHorariosFuturos() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        long servicioId = crearServicio(proveedor);
        long franjaId = publicarFranja(proveedor, servicioId, 2);

        consultar(delete("/api/servicios/" + servicioId), proveedor).andExpect(status().isNoContent());

        consultar(get("/api/servicios/" + servicioId + "/franjas"), proveedor)
                .andExpect(jsonPath("$[0].estado").value("RETIRADA"));
        enviar(post("/api/reservas"), mapa("franjaId", franjaId), cliente).andExpect(status().isConflict());
    }

    // ---------------------------------------------------------------- Reservas del cliente

    @Test
    void clienteConOtraReservaALaMismaHora_noPuedeReservar() throws Exception {
        String proveedorA = registrarYLogin("PROVEEDOR");
        String proveedorB = registrarYLogin("PROVEEDOR");
        String cliente = registrarYLogin("CLIENTE");
        OffsetDateTime inicio = en(33, 15);
        long franjaA = publicarFranjaEn(proveedorA, crearServicio(proveedorA), inicio, 1);
        long franjaB = publicarFranjaEn(proveedorB, crearServicio(proveedorB), inicio.plusMinutes(30), 1);

        reservar(cliente, franjaA);
        enviar(post("/api/reservas"), mapa("franjaId", franjaB), cliente).andExpect(status().isConflict());
    }

    // ---------------------------------------------------------------- Perfil

    @Test
    void telefonoConLetras_seRechaza() throws Exception {
        Sesion sesion = registrarYLoginSesion("CLIENTE");
        enviar(put("/api/usuarios/me"),
                mapa("nombre", "Usuario de prueba", "correo", sesion.correo(), "telefono", "abc123"), sesion.token())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.telefono").exists());
    }

    @Test
    void nombreSinLetras_seRechazaEnElRegistro() throws Exception {
        enviar(post("/api/auth/register"),
                mapa("nombre", "12345", "correo", correoUnico(), "contrasena", "Clave1234", "rol", "CLIENTE"), null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombre").exists());
    }

    // ---------------------------------------------------------------- Seguridad

    @Test
    void cincoIntentosFallidos_bloqueanElInicioDeSesionTemporalmente() throws Exception {
        Sesion sesion = registrarYLoginSesion("CLIENTE");
        for (int i = 0; i < 5; i++) {
            enviar(post("/api/auth/login"), mapa("correo", sesion.correo(), "contrasena", "Incorrecta1"), null)
                    .andExpect(status().isUnauthorized());
        }
        // ni siquiera con la contraseña correcta se permite entrar mientras dura el bloqueo
        enviar(post("/api/auth/login"), mapa("correo", sesion.correo(), "contrasena", "Clave1234"), null)
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void pedirUnNuevoEnlaceDeRecuperacion_anulaElAnterior() throws Exception {
        Sesion sesion = registrarYLoginSesion("CLIENTE");
        enviar(post("/api/auth/recuperar"), mapa("correo", sesion.correo()), null).andExpect(status().isOk());
        String primero = ultimoTokenDe(sesion.correo());
        enviar(post("/api/auth/recuperar"), mapa("correo", sesion.correo()), null).andExpect(status().isOk());
        String segundo = ultimoTokenDe(sesion.correo());

        enviar(post("/api/auth/restablecer"),
                mapa("token", primero, "nuevaContrasena", "ClaveNueva1", "confirmarContrasena", "ClaveNueva1"), null)
                .andExpect(status().isBadRequest());
        enviar(post("/api/auth/restablecer"),
                mapa("token", segundo, "nuevaContrasena", "ClaveNueva1", "confirmarContrasena", "ClaveNueva1"), null)
                .andExpect(status().isOk());
    }

    @Test
    void demasiadasSolicitudesDeRecuperacion_seLimitan() throws Exception {
        Sesion sesion = registrarYLoginSesion("CLIENTE");
        for (int i = 0; i < 3; i++) {
            enviar(post("/api/auth/recuperar"), mapa("correo", sesion.correo()), null).andExpect(status().isOk());
        }
        enviar(post("/api/auth/recuperar"), mapa("correo", sesion.correo()), null)
                .andExpect(status().isTooManyRequests());
    }

    private String ultimoTokenDe(String correo) {
        return tokens.findFirstByUsuario_CorreoOrderByIdDesc(correo)
                .map(TokenRecuperacion::getToken)
                .orElseThrow(() -> new AssertionError("No se generó el token de recuperación para " + correo));
    }
}
