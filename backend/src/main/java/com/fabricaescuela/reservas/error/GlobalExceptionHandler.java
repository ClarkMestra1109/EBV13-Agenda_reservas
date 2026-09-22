package com.fabricaescuela.reservas.error;

import com.fabricaescuela.reservas.dto.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> negocio(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(new ErrorResponse(e.getMessage(), null));
    }

    /** Devuelve un mapa campo -> mensaje para que el frontend indique qué corregir. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validacion(MethodArgumentNotValidException e) {
        Map<String, String> errores = new LinkedHashMap<>();
        for (FieldError fe : e.getBindingResult().getFieldErrors()) {
            boolean faltante = "NotBlank".equals(fe.getCode()) || "NotNull".equals(fe.getCode());
            // Si el campo está vacío, prevalece el mensaje "es obligatorio" sobre el de formato.
            if (faltante || !errores.containsKey(fe.getField())) {
                errores.put(fe.getField(), fe.getDefaultMessage());
            }
        }
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("Hay campos por completar o corregir", errores));
    }

    /** JSON mal formado, números o enums con formato inválido. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> formato(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("El formato de los datos enviados no es válido", null));
    }
}
