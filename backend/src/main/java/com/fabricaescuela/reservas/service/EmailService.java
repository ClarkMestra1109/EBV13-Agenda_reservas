package com.fabricaescuela.reservas.service;

/**
 * Envío de correos, desacoplado de la implementación concreta.
 * {@link LogEmailService} solo registra el envío en el log (desarrollo y pruebas) y
 * {@link BrevoEmailService} lo envía de verdad. Se elige con la variable EMAIL_PROVEEDOR,
 * sin tocar el resto del código.
 */
public interface EmailService {

    void enviarCorreo(String destino, String asunto, String cuerpo);
}
