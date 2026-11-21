package com.fabricaescuela.reservas;

import org.junit.jupiter.api.Test;

import java.util.Base64;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Perfil comercial, cambio de contraseña, y foto/modalidad/ubicación de los servicios. */
class ReservasPerfilServiciosTests extends PruebasBase {

    /** PNG válido de 1x1 píxel. */
    private static final String PNG_BASE64 =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    private Map<String, Object> perfil(String correo, String nombreComercial, String sitioWeb) {
        return mapa("nombre", "Usuario de prueba", "correo", correo, "telefono", "",
                "nombreComercial", nombreComercial, "sectorActividad", "Belleza",
                "descripcionComercial", "Barbería de barrio", "sitioWeb", sitioWeb);
    }

    // ------------------------------------------------------------------ perfil comercial

    @Test
    void proveedor_guardaSuInformacionComercialYElClienteLaVeEnElCatalogo() throws Exception {
        Sesion proveedor = registrarYLoginSesion("PROVEEDOR");
        enviar(put("/api/usuarios/me"), perfil(proveedor.correo(), "Barbería El Corte", "https://elcorte.co"),
                proveedor.token())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreComercial").value("Barbería El Corte"))
                .andExpect(jsonPath("$.sitioWeb").value("https://elcorte.co"));
        long servicioId = crearServicio(proveedor.token());

        String cliente = registrarYLogin("CLIENTE");
        String catalogo = consultar(get("/api/catalogo/servicios"), cliente)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        var servicio = buscarPorId(catalogo, servicioId);
        org.assertj.core.api.Assertions.assertThat(servicio.get("nombreComercial").asText()).isEqualTo("Barbería El Corte");
        org.assertj.core.api.Assertions.assertThat(servicio.get("sectorActividad").asText()).isEqualTo("Belleza");
    }

    @Test
    void sitioWebInvalido_seRechazaYElClienteNoGuardaDatosComerciales() throws Exception {
        Sesion proveedor = registrarYLoginSesion("PROVEEDOR");
        enviar(put("/api/usuarios/me"), perfil(proveedor.correo(), "Mi negocio", "mi negocio punto com"),
                proveedor.token())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.sitioWeb").exists());

        Sesion cliente = registrarYLoginSesion("CLIENTE");
        enviar(put("/api/usuarios/me"), perfil(cliente.correo(), "No aplica", ""), cliente.token())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreComercial").doesNotExist());
    }

    // ------------------------------------------------------------------ cambio de contraseña

    @Test
    void cambiarContrasena_verificaLaActualYPermiteEntrarConLaNueva() throws Exception {
        Sesion sesion = registrarYLoginSesion("CLIENTE");
        String url = "/api/usuarios/me/contrasena";

        enviar(post(url), mapa("contrasenaActual", "Incorrecta1", "nuevaContrasena", "NuevaClave1",
                "confirmarContrasena", "NuevaClave1"), sesion.token())
                .andExpect(status().isBadRequest());
        enviar(post(url), mapa("contrasenaActual", "Clave1234", "nuevaContrasena", "NuevaClave1",
                "confirmarContrasena", "OtraClave1"), sesion.token())
                .andExpect(status().isBadRequest());
        enviar(post(url), mapa("contrasenaActual", "Clave1234", "nuevaContrasena", "Clave1234",
                "confirmarContrasena", "Clave1234"), sesion.token())
                .andExpect(status().isBadRequest());
        enviar(post(url), mapa("contrasenaActual", "Clave1234", "nuevaContrasena", "corta",
                "confirmarContrasena", "corta"), sesion.token())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nuevaContrasena").exists());

        enviar(post(url), mapa("contrasenaActual", "Clave1234", "nuevaContrasena", "NuevaClave1",
                "confirmarContrasena", "NuevaClave1"), sesion.token())
                .andExpect(status().isNoContent());

        enviar(post("/api/auth/login"), mapa("correo", sesion.correo(), "contrasena", "Clave1234"), null)
                .andExpect(status().isUnauthorized());
        enviar(post("/api/auth/login"), mapa("correo", sesion.correo(), "contrasena", "NuevaClave1"), null)
                .andExpect(status().isOk());
    }

    @Test
    void cambiarContrasena_sinSesion_seNiega() throws Exception {
        enviar(post("/api/usuarios/me/contrasena"), mapa("contrasenaActual", "Clave1234",
                "nuevaContrasena", "NuevaClave1", "confirmarContrasena", "NuevaClave1"), null)
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------ modalidad y ubicación

    @Test
    void servicioPresencialExigeUbicacionYVirtualNo() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        Map<String, Object> cuerpo = servicioValido();
        cuerpo.put("modalidad", "PRESENCIAL");
        cuerpo.put("ubicacion", "");
        enviar(post("/api/servicios"), cuerpo, proveedor).andExpect(status().isBadRequest());

        cuerpo.put("ubicacion", "Calle 10 # 20-30, Medellín");
        String creado = enviar(post("/api/servicios"), cuerpo, proveedor)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.modalidad").value("PRESENCIAL"))
                .andExpect(jsonPath("$.ubicacion").value("Calle 10 # 20-30, Medellín"))
                .andReturn().getResponse().getContentAsString();
        long id = om.readTree(creado).get("id").asLong();

        // actualizar sin enviar modalidad (p. ej. al solo desactivar) conserva la ubicación
        Map<String, Object> soloEstado = servicioValido();
        soloEstado.put("estado", "INACTIVO");
        enviar(put("/api/servicios/" + id), soloEstado, proveedor)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ubicacion").value("Calle 10 # 20-30, Medellín"));

        Map<String, Object> virtual = servicioValido();
        virtual.put("modalidad", "VIRTUAL");
        virtual.put("ubicacion", "se ignora");
        enviar(put("/api/servicios/" + id), virtual, proveedor)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modalidad").value("VIRTUAL"))
                .andExpect(jsonPath("$.ubicacion").doesNotExist());
    }

    // ------------------------------------------------------------------ foto del servicio

    @Test
    void fotoDelServicio_seGuardaSeVeSinSesionYSePuedeQuitar() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long id = crearServicio(proveedor);

        enviar(put("/api/servicios/" + id + "/imagen"), mapa("imagen", "data:image/png;base64," + PNG_BASE64), proveedor)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagenVersion").isNumber());

        byte[] esperado = Base64.getDecoder().decode(PNG_BASE64);
        consultar(get("/api/imagenes/servicios/" + id), null)
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(content().bytes(esperado));

        consultar(delete("/api/servicios/" + id + "/imagen"), proveedor)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagenVersion").doesNotExist());
        consultar(get("/api/imagenes/servicios/" + id), null).andExpect(status().isNotFound());
    }

    @Test
    void fotoFalsaOAjena_seRechaza() throws Exception {
        String proveedor = registrarYLogin("PROVEEDOR");
        long id = crearServicio(proveedor);
        String textoComoPng = Base64.getEncoder().encodeToString("<script>alert(1)</script>".getBytes());

        enviar(put("/api/servicios/" + id + "/imagen"), mapa("imagen", "data:image/png;base64," + textoComoPng), proveedor)
                .andExpect(status().isBadRequest());
        enviar(put("/api/servicios/" + id + "/imagen"), mapa("imagen", "data:text/html;base64," + PNG_BASE64), proveedor)
                .andExpect(status().isBadRequest());
        enviar(put("/api/servicios/" + id + "/imagen"), mapa("imagen", "data:image/png;base64," + PNG_BASE64),
                registrarYLogin("PROVEEDOR"))
                .andExpect(status().isForbidden());
    }

    private com.fasterxml.jackson.databind.JsonNode buscarPorId(String json, long id) throws Exception {
        for (var nodo : om.readTree(json)) {
            if (nodo.get("id").asLong() == id) {
                return nodo;
            }
        }
        throw new AssertionError("El servicio " + id + " no aparece en el catálogo");
    }
}
