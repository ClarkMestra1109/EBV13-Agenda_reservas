package com.fabricaescuela.reservas.error;

import com.fabricaescuela.reservas.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> negocio(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(new ErrorResponse(e.getMessage(), null));
    }

    /** Devuelve un mapa campo -> mensaje para que el frontend indique qué corregir. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validacion(MethodArgumentNotValidException e) {
        Map<String, String> errores = new LinkedHashMap<>();
        for (FieldError fe : e.getBindingResult().getFieldErrors()) {
            boolean faltante = "NotBlank".equals(fe.getCode()) || "NotNull".equals(fe.getCode())
                    || "NotEmpty".equals(fe.getCode());
            // Si el campo está vacío, prevalece el mensaje "es obligatorio" sobre el de formato.
            if (faltante || !errores.containsKey(fe.getField())) {
                errores.put(fe.getField(), fe.getDefaultMessage());
            }
        }
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("Hay campos por completar o corregir", errores));
    }

    /** JSON mal formado, números, fechas o enums con formato inválido. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> formato(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("El formato de los datos enviados no es válido", null));
    }

    /** Parámetros de la URL con un tipo incorrecto (p. ej. un id con letras o una fecha inválida). */
    @ExceptionHandler({MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<ErrorResponse> parametro(Exception e) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("Alguno de los parámetros de la solicitud no es válido", null));
    }

    /** Seguridad a nivel de método (@PreAuthorize): mismo cuerpo que RestAccessDeniedHandler. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> sinPermiso(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("No tiene permiso para realizar esta operación", null));
    }

    /** Una restricción de la base de datos rechazó el cambio (dato duplicado o en uso). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> integridad(DataIntegrityViolationException e) {
        log.warn("Violación de integridad de datos: {}", e.getMostSpecificCause().getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse("La operación entra en conflicto con datos existentes", null));
    }

    /**
     * Cualquier otro error. Los errores propios de Spring MVC (ruta inexistente, método no
     * permitido, etc.) conservan su código; lo inesperado se registra en el log y se responde
     * con un 500 genérico, sin exponer detalles internos al cliente.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> inesperado(Exception e) {
        if (e instanceof org.springframework.web.ErrorResponse respuestaSpring) {
            HttpStatusCode estado = respuestaSpring.getStatusCode();
            String mensaje = estado.value() == 404 ? "El recurso solicitado no existe"
                    : estado.value() == 405 ? "Operación no permitida sobre este recurso"
                    : "La solicitud no pudo procesarse";
            return ResponseEntity.status(estado).body(new ErrorResponse(mensaje, null));
        }
        log.error("Error inesperado al procesar la solicitud", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Ocurrió un error inesperado. Intente de nuevo más tarde", null));
    }
}
