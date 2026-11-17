package com.fabricaescuela.reservas.security;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Contador de intentos por clave (p. ej. "login:correo") dentro de una ventana de tiempo.
 * Frena la adivinación de contraseñas y el abuso de la recuperación de acceso.
 * Vive en memoria: es suficiente para una sola instancia del backend; con varias instancias
 * habría que moverlo a un almacén compartido (Redis o la base de datos).
 */
@Component
public class LimitadorIntentos {

    private static final int TAMANO_PARA_LIMPIAR = 10_000;

    private record Registro(int cantidad, Instant inicioVentana) {
    }

    private final ConcurrentHashMap<String, Registro> registros = new ConcurrentHashMap<>();

    /** Minutos que faltan para poder reintentar, o 0 si la clave no está bloqueada. */
    public long minutosDeBloqueo(String clave, int maximo, Duration ventana) {
        Registro registro = registros.get(clave);
        if (registro == null) {
            return 0;
        }
        Instant finVentana = registro.inicioVentana().plus(ventana);
        Instant ahora = Instant.now();
        if (!ahora.isBefore(finVentana)) {
            registros.remove(clave, registro);
            return 0;
        }
        if (registro.cantidad() < maximo) {
            return 0;
        }
        return Math.max(1, Duration.between(ahora, finVentana).toMinutes() + 1);
    }

    /** Suma un intento a la clave; la ventana empieza con el primero. */
    public void registrar(String clave, Duration ventana) {
        Instant ahora = Instant.now();
        registros.compute(clave, (k, actual) -> {
            if (actual == null || !ahora.isBefore(actual.inicioVentana().plus(ventana))) {
                return new Registro(1, ahora);
            }
            return new Registro(actual.cantidad() + 1, actual.inicioVentana());
        });
        if (registros.size() > TAMANO_PARA_LIMPIAR) {
            registros.entrySet().removeIf(e -> !ahora.isBefore(e.getValue().inicioVentana().plus(ventana)));
        }
    }

    public void limpiar(String clave) {
        registros.remove(clave);
    }
}
