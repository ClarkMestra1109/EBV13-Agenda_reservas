package com.fabricaescuela.reservas;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Utilidades compartidas por las pruebas de aceptación. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class PruebasBase {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper om;

    protected ResultActions enviar(MockHttpServletRequestBuilder base, Object cuerpo, String token) throws Exception {
        MockHttpServletRequestBuilder req = base
                .contentType(MediaType.APPLICATION_JSON)
                .content(om.writeValueAsString(cuerpo));
        if (token != null) {
            req.header("Authorization", "Bearer " + token);
        }
        return mvc.perform(req);
    }

    protected ResultActions consultar(MockHttpServletRequestBuilder base, String token) throws Exception {
        if (token != null) {
            base.header("Authorization", "Bearer " + token);
        }
        return mvc.perform(base);
    }

    protected Map<String, Object> mapa(Object... clavesYValores) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < clavesYValores.length; i += 2) {
            m.put((String) clavesYValores[i], clavesYValores[i + 1]);
        }
        return m;
    }

    protected String correoUnico() {
        return "usuario-" + UUID.randomUUID() + "@ejemplo.com";
    }

    protected Map<String, Object> servicioValido() {
        return mapa("nombre", "Corte de cabello", "descripcion", "Corte clasico", "duracionMin", 30, "precio", 25000);
    }

    protected String registrarYLogin(String rol) throws Exception {
        String correo = correoUnico();
        enviar(post("/api/auth/register"),
                mapa("nombre", "Usuario de prueba", "correo", correo, "contrasena", "Clave1234", "rol", rol), null)
                .andExpect(status().isCreated());
        String respuesta = enviar(post("/api/auth/login"), mapa("correo", correo, "contrasena", "Clave1234"), null)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(respuesta).get("token").asText();
    }

    protected long crearServicio(String token) throws Exception {
        String respuesta = enviar(post("/api/servicios"), servicioValido(), token)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(respuesta).get("id").asLong();
    }

    /** Publica una franja que empieza dentro de 2 días y dura 1 hora. */
    protected long publicarFranja(String tokenProveedor, long servicioId, int cupos) throws Exception {
        OffsetDateTime inicio = OffsetDateTime.now(ZoneOffset.UTC).plusDays(2);
        String respuesta = enviar(post("/api/servicios/" + servicioId + "/franjas"),
                mapa("inicio", inicio.toString(), "fin", inicio.plusHours(1).toString(), "cupoTotal", cupos),
                tokenProveedor)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(respuesta).get("id").asLong();
    }

    protected long reservar(String tokenCliente, long franjaId) throws Exception {
        String respuesta = enviar(post("/api/reservas"), mapa("franjaId", franjaId), tokenCliente)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return om.readTree(respuesta).get("id").asLong();
    }

    /** Variante de {@link #registrarYLogin} que también devuelve el correo usado. */
    protected record Sesion(String correo, String token) {
    }

    protected Sesion registrarYLoginSesion(String rol) throws Exception {
        String correo = correoUnico();
        enviar(post("/api/auth/register"),
                mapa("nombre", "Usuario de prueba", "correo", correo, "contrasena", "Clave1234", "rol", rol), null)
                .andExpect(status().isCreated());
        String respuesta = enviar(post("/api/auth/login"), mapa("correo", correo, "contrasena", "Clave1234"), null)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return new Sesion(correo, om.readTree(respuesta).get("token").asText());
    }
}
