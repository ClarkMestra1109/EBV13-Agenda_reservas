package com.fabricaescuela.reservas.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(String mensaje, Map<String, String> errores) {
}
