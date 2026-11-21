package com.fabricaescuela.reservas.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Envía correos reales con la API HTTP de Brevo. Se usa HTTPS (puerto 443) porque el plan
 * gratuito de Render bloquea los puertos SMTP (25, 465 y 587). Se activa con
 * EMAIL_PROVEEDOR=brevo; si no, se usa {@link LogEmailService}.
 *
 * <p>Si Brevo rechaza el envío se lanza una excepción: la recuperación de contraseña (HU04)
 * informa el fallo al usuario y los recordatorios (HU19) lo dejan registrado.
 */
@Service
@ConditionalOnProperty(name = "app.email.proveedor", havingValue = "brevo")
public class BrevoEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(BrevoEmailService.class);
    private static final URI ENDPOINT = URI.create("https://api.brevo.com/v3/smtp/email");
    private static final Pattern URL = Pattern.compile("https?://[^\\s<]+");

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper json;
    private final String apiKey;
    private final String remitenteCorreo;
    private final String remitenteNombre;

    public BrevoEmailService(ObjectMapper json,
                             @Value("${app.email.brevo.api-key:}") String apiKey,
                             @Value("${app.email.remitente.correo:}") String remitenteCorreo,
                             @Value("${app.email.remitente.nombre:AgendaPro}") String remitenteNombre) {
        if (apiKey.isBlank() || remitenteCorreo.isBlank()) {
            throw new IllegalStateException("Para enviar correos con Brevo defina BREVO_API_KEY y "
                    + "EMAIL_REMITENTE (un remitente verificado en Brevo)");
        }
        this.json = json;
        this.apiKey = apiKey;
        this.remitenteCorreo = remitenteCorreo;
        this.remitenteNombre = remitenteNombre;
        log.info("Correos reales activados con Brevo (remitente {})", remitenteCorreo);
    }

    @Override
    public void enviarCorreo(String destino, String asunto, String cuerpo) {
        Map<String, Object> mensaje = Map.of(
                "sender", Map.of("name", remitenteNombre, "email", remitenteCorreo),
                "to", List.of(Map.of("email", destino)),
                "subject", asunto,
                "htmlContent", comoHtml(asunto, cuerpo));
        try {
            HttpRequest request = HttpRequest.newBuilder(ENDPOINT)
                    .timeout(Duration.ofSeconds(15))
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .header("api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(mensaje)))
                    .build();
            HttpResponse<String> respuesta = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (respuesta.statusCode() / 100 != 2) {
                // El cuerpo de Brevo explica el motivo (clave inválida, remitente sin verificar...).
                throw new IllegalStateException("Brevo respondió " + respuesta.statusCode() + ": " + respuesta.body());
            }
            log.info("Correo enviado a {} | Asunto: {}", destino, asunto);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Se interrumpió el envío del correo", e);
        } catch (java.io.IOException e) {
            throw new IllegalStateException("No fue posible conectar con Brevo: " + e.getMessage(), e);
        }
    }

    /** Convierte el texto en un HTML sencillo: escapa el contenido y vuelve clicables los enlaces. */
    static String comoHtml(String asunto, String cuerpo) {
        String escapado = HtmlUtils.htmlEscape(cuerpo);
        Matcher m = URL.matcher(escapado);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String url = m.group();
            m.appendReplacement(sb, Matcher.quoteReplacement(
                    "<a href=\"" + url + "\" style=\"color:#1d4ed8;font-weight:bold\">" + url + "</a>"));
        }
        m.appendTail(sb);
        String parrafos = sb.toString().replace("\n", "<br>");
        return "<!DOCTYPE html><html><body style=\"font-family:Arial,sans-serif;color:#0b1c30;"
                + "background:#f8faff;padding:24px\"><div style=\"max-width:560px;margin:auto;background:#fff;"
                + "border:1px solid #e2e8f0;border-radius:16px;padding:24px\">"
                + "<h2 style=\"margin-top:0\">" + HtmlUtils.htmlEscape(asunto) + "</h2>"
                + "<p style=\"font-size:14px;line-height:1.6\">" + parrafos + "</p>"
                + "<p style=\"font-size:12px;color:#64748b\">Este es un mensaje automático de AgendaPro. "
                + "Si no lo esperabas, puedes ignorarlo.</p></div></body></html>";
    }
}
