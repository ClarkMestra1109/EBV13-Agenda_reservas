// Reglas de validación compartidas por los formularios. Deben coincidir con las del backend
// (que es quien tiene la última palabra): aquí solo se adelanta el error para que el usuario
// lo vea de inmediato y dentro del formulario.

const ZONA = 'America/Bogota';

export const PRECIO_MAXIMO = 50_000_000;
export const MESES_MAX_ANTICIPACION = 6;
export const MESES_MAX_RECURRENCIA = 3;
export const HORAS_MAX_FRANJA = 12;

/** Fecha de hoy en Colombia como YYYY-MM-DD (el formato de los <input type="date">). */
export function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Suma días y/o meses a una fecha YYYY-MM-DD y la devuelve en el mismo formato. */
export function sumarAFecha(fecha: string, { dias = 0, meses = 0 }: { dias?: number; meses?: number }): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  // Igual que LocalDate.plusMonths en el backend: si el día no existe en el mes destino
  // (p. ej. 31 de agosto + 6 meses), se usa el último día de ese mes.
  const destino = new Date(Date.UTC(anio, mes - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
  destino.setUTCDate(Math.min(dia, ultimoDia) + dias);
  return destino.toISOString().slice(0, 10);
}

/** Convierte una fecha YYYY-MM-DD a texto legible, p. ej. "13 de mayo de 2027". */
export function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(anio, mes - 1, dia))
  );
}

/**
 * Interpreta un precio escrito por el usuario. Acepta "35000", "35000.50", "35000,50" y el
 * formato colombiano con puntos de miles "35.000" o "1.250.000,50". Devuelve null si el texto
 * no es un número válido con máximo 2 decimales.
 */
export function interpretarPrecio(texto: string): number | null {
  const limpio = texto.replace(/[\s$]/g, '').replace(/COP$/i, '');
  if (!limpio) return null;

  let normalizado: string;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(limpio)) {
    // Puntos como separador de miles y coma decimal opcional.
    normalizado = limpio.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+([.,]\d{1,2})?$/.test(limpio)) {
    normalizado = limpio.replace(',', '.');
  } else {
    return null;
  }

  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}

export function formatearCOP(valor: number): string {
  return `$${valor.toLocaleString('es-CO', { maximumFractionDigits: 2 })} COP`;
}

/** Un nombre de persona válido: entre 2 y 100 caracteres y con al menos una letra. */
export function validarNombrePersona(nombre: string): string | null {
  const valor = nombre.trim();
  if (!valor) return 'El nombre es obligatorio.';
  if (valor.length < 2 || !/\p{L}/u.test(valor)) {
    return 'El nombre debe tener al menos 2 caracteres e incluir letras.';
  }
  if (valor.length > 100) return 'El nombre no puede superar 100 caracteres.';
  return null;
}

export function validarCorreo(correo: string): string | null {
  const valor = correo.trim();
  if (!valor) return 'El correo electrónico es obligatorio.';
  if (valor.length > 150 || !/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(valor)) {
    return 'Ingresa un correo electrónico válido, por ejemplo nombre@correo.com.';
  }
  return null;
}

export function validarContrasena(contrasena: string): string | null {
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(contrasena)) {
    return 'La contraseña debe tener entre 8 y 72 caracteres, con letras y números.';
  }
  return null;
}

/** Quita espacios, guiones y paréntesis que la gente suele escribir en un teléfono. */
export function normalizarTelefono(telefono: string): string {
  return telefono.replace(/[\s\-().]/g, '');
}

/** El teléfono es opcional; si se escribe, debe tener de 7 a 15 dígitos (con "+" inicial opcional). */
export function validarTelefono(telefono: string): string | null {
  const valor = normalizarTelefono(telefono);
  if (!valor) return null;
  if (!/^\+?\d{7,15}$/.test(valor)) {
    return 'El teléfono debe tener entre 7 y 15 dígitos, sin letras. Ejemplo: 3001234567.';
  }
  return null;
}
