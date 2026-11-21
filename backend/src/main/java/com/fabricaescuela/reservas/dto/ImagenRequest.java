package com.fabricaescuela.reservas.dto;

import jakarta.validation.constraints.NotBlank;

/** Foto de un servicio como data URL: "data:image/webp;base64,...". */
public record ImagenRequest(
        @NotBlank(message = "Debe enviar la imagen")
        String imagen
) {
}
