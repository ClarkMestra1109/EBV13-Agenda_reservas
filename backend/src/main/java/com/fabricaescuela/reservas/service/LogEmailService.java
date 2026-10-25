package com.fabricaescuela.reservas.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Implementación por defecto: registra el correo en el log en vez de enviarlo de verdad. */
@Service
public class LogEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(LogEmailService.class);

    @Override
    public void enviarCorreo(String destino, String asunto, String cuerpo) {
        log.info("[EMAIL SIMULADO] Para: {} | Asunto: {} | Cuerpo: {}", destino, asunto, cuerpo);
    }
}
