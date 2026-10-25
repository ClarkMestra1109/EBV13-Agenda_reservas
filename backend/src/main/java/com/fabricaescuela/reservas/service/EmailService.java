package com.fabricaescuela.reservas.service;

/**
 * Envío de correos, desacoplado de la implementación concreta.
 * En este sprint no hay un proveedor SMTP configurado, así que {@link LogEmailService}
 * solo registra el envío en el log. Para producción basta con crear otra implementación
 * (por ejemplo con JavaMailSender y credenciales SMTP en variables de entorno) y marcarla
 * con @Primary o reemplazar el bean actual: el resto del código no cambia.
 */
public interface EmailService {

    void enviarCorreo(String destino, String asunto, String cuerpo);
}
