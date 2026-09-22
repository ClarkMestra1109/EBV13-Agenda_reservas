package com.fabricaescuela.reservas;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pruebas de aceptación de HU01, HU02, HU05 y HU06 (criterios Given/When/Then). */
class ReservasApiTests extends PruebasBase {

    // ---------------------------------------------------------------- HU01 Crear cuenta

    @Test
    void hu01_registroValido_creaCuentaConElRolSeleccionado() throws Exception {
        enviar(post("/api/auth/register"),
                mapa("nombre", "Ana Pérez", "correo", correoUnico(), "contrasena", "Clave1234", "rol", "CLIENTE"), null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rol").value("CLIENTE"))
                .andExpect(jsonPath("$.contrasena").doesNotExist())
                .andExpect(jsonPath("$.contrasenaHash").doesNotExist());
    }

    @Test
    void hu01_sinCamposObligatorios_noCreaCuentaEIndicaLosCampos() throws Exception {
        enviar(post("/api/auth/register"), mapa(), null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombre").exists())
                .andExpect(jsonPath("$.errores.correo").exists())
                .andExpect(jsonPath("$.errores.contrasena").exists())
                .andExpect(jsonPath("$.errores.rol").exists());
    }

    @Test
    void hu01_correoDuplicado_informaQueYaEstaRegistrado() throws Exception {
        String correo = correoUnico();
        Map<String, Object> cuerpo = mapa("nombre", "Ana", "correo", correo, "contrasena", "Clave1234", "rol", "CLIENTE");
        enviar(post("/api/auth/register"), cuerpo, null).andExpect(status().isCreated());
        enviar(post("/api/auth/register"), cuerpo, null)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value(containsString("registrado")));
    }

    @Test
    void hu01_correoConFormatoInvalido_noCreaCuenta() throws Exception {
        enviar(post("/api/auth/register"),
                mapa("nombre", "Ana", "correo", "esto-no-es-un-correo", "contrasena", "Clave1234", "rol", "CLIENTE"), null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.correo").value(containsString("correo")));
    }

    // ---------------------------------------------------------------- HU02 Iniciar sesión

    @Test
    void hu02_credencialesValidas_devuelveTokenYRol() throws Exception {
        String correo = correoUnico();
        enviar(post("/api/auth/register"),
                mapa("nombre", "Luis", "correo", correo, "contrasena", "Clave1234", "rol", "PROVEEDOR"), null)
                .andExpect(status().isCreated());
        enviar(post("/api/auth/login"), mapa("correo", correo, "contrasena", "Clave1234"), null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.usuario.rol").value("PROVEEDOR"));
    }

    @Test
    void hu02_credencialesIncorrectas_niegaElAcceso() throws Exception {
        String correo = correoUnico();
        enviar(post("/api/auth/register"),
                mapa("nombre", "Luis", "correo", correo, "contrasena", "Clave1234", "rol", "CLIENTE"), null)
                .andExpect(status().isCreated());
        enviar(post("/api/auth/login"), mapa("correo", correo, "contrasena", "OtraClave99"), null)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value("Credenciales incorrectas"));
    }

    @Test
    void hu02_sinCorreoNiContrasena_indicaLosCamposFaltantes() throws Exception {
        enviar(post("/api/auth/login"), mapa(), null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.correo").exists())
                .andExpect(jsonPath("$.errores.contrasena").exists());
    }

    // ---------------------------------------------------------------- HU05 Crear servicio

    @Test
    void hu05_proveedorCreaServicio_apareceEnSuListado() throws Exception {
        String token = registrarYLogin("PROVEEDOR");
        long id = crearServicio(token);

        mvc.perform(get("/api/servicios/mis-servicios").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].estado").value("ACTIVO"));
    }

    @Test
    void hu05_sinCamposObligatorios_noCreaElServicio() throws Exception {
        String token = registrarYLogin("PROVEEDOR");
        enviar(post("/api/servicios"), mapa(), token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.nombre").exists())
                .andExpect(jsonPath("$.errores.descripcion").exists())
                .andExpect(jsonPath("$.errores.duracionMin").exists())
                .andExpect(jsonPath("$.errores.precio").exists());
    }

    @Test
    void hu05_duracionInvalida_pideCorregirla() throws Exception {
        String token = registrarYLogin("PROVEEDOR");
        Map<String, Object> cuerpo = servicioValido();
        cuerpo.put("duracionMin", 0);
        enviar(post("/api/servicios"), cuerpo, token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.duracionMin").exists());
    }

    @Test
    void hu05_formatoInvalido_noCreaElServicio() throws Exception {
        String token = registrarYLogin("PROVEEDOR");
        Map<String, Object> cuerpo = servicioValido();
        cuerpo.put("precio", "abc");
        enviar(post("/api/servicios"), cuerpo, token)
                .andExpect(status().isBadRequest());
    }

    @Test
    void hu05_unClienteNoPuedeCrearServicios() throws Exception {
        String token = registrarYLogin("CLIENTE");
        enviar(post("/api/servicios"), servicioValido(), token)
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- HU06 Actualizar servicio

    @Test
    void hu06_servicioPropioConDatosValidos_guardaLosCambios() throws Exception {
        String token = registrarYLogin("PROVEEDOR");
        long id = crearServicio(token);
        Map<String, Object> cambios = servicioValido();
        cambios.put("nombre", "Corte moderno");
        cambios.put("duracionMin", 45);
        enviar(put("/api/servicios/" + id), cambios, token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Corte moderno"))
                .andExpect(jsonPath("$.duracionMin").value(45));
    }

    @Test
    void hu06_servicioAjeno_niegaLaOperacionYNoCambiaNada() throws Exception {
        String duenio = registrarYLogin("PROVEEDOR");
        String otro = registrarYLogin("PROVEEDOR");
        long id = crearServicio(duenio);

        Map<String, Object> cambios = servicioValido();
        cambios.put("nombre", "Intento de otro proveedor");
        enviar(put("/api/servicios/" + id), cambios, otro)
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/servicios/mis-servicios").header("Authorization", "Bearer " + duenio))
                .andExpect(jsonPath("$[0].nombre").value("Corte de cabello"));
    }

    @Test
    void hu06_datosInvalidos_noGuardaLosCambios() throws Exception {
        String token = registrarYLogin("PROVEEDOR");
        long id = crearServicio(token);
        Map<String, Object> cambios = servicioValido();
        cambios.put("duracionMin", 9999);
        enviar(put("/api/servicios/" + id), cambios, token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.duracionMin").exists());
    }

    @Test
    void hu06_datoObligatorioVacio_solicitaCompletarElCampo() throws Exception {
        String token = registrarYLogin("PROVEEDOR");
        long id = crearServicio(token);
        Map<String, Object> cambios = servicioValido();
        cambios.put("descripcion", "");
        enviar(put("/api/servicios/" + id), cambios, token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores.descripcion").exists());
    }

    @Test
    void hu06_usuarioNoAutenticado_debeIniciarSesion() throws Exception {
        enviar(put("/api/servicios/1"), servicioValido(), null)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensaje").value(containsString("iniciar sesi")));
    }
}
