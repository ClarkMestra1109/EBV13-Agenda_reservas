const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface ApiUser {
  id: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  rol: 'CLIENTE' | 'PROVEEDOR';
}

export interface LoginResponse {
  token: string;
  usuario: ApiUser;
}

export interface RegisterRequest {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: 'CLIENTE' | 'PROVEEDOR';
}

export interface ApiService {
  id: number;
  nombre: string;
  descripcion: string;
  duracionMin: number;
  precio: number;
  proveedorNombre: string;
  nombreComercial?: string | null;
  sectorActividad?: string | null;
  descripcionComercial?: string | null;
  sitioWeb?: string | null;
}

export interface ApiProviderService {
  id: number;
  nombre: string;
  descripcion: string;
  duracionMin: number;
  precio: number;
  estado: string;
  fechaCreacion: string;
}

export interface ApiSlot {
  id: number;
  servicioId: number;
  inicio: string;
  fin: string;
  cupoTotal: number;
  cuposOcupados: number;
  cuposDisponibles: number;
  estado: 'PUBLICADA' | 'RETIRADA';
}

export interface ApiBooking {
  id: number;
  estado: 'CONFIRMADA' | 'CANCELADA';
  franjaId: number;
  inicio: string;
  fin: string;
  servicioId: number;
  servicioNombre: string;
  proveedorNombre: string;
  clienteNombre: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<T> {
  const token = localStorage.getItem('agendapro_token');

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (authenticated && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    // El navegador no logró conectarse (servidor iniciando, sin internet o bloqueado por CORS).
    throw new Error(
      'No fue posible conectar con el servidor. Revisa tu conexión; si el servicio estaba inactivo puede tardar cerca de un minuto en responder. Intenta de nuevo.'
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    let message =
      typeof body === 'object' && body
        ? body.mensaje || body.message || 'La operación no pudo completarse'
        : body || 'La operación no pudo completarse';

    // Errores de validación: el backend envía un mensaje por campo. Se muestran todos para
    // que el usuario sepa exactamente qué corregir, en vez de un aviso genérico.
    if (typeof body === 'object' && body && body.errores && typeof body.errores === 'object') {
      const detalles = Array.from(new Set(Object.values(body.errores as Record<string, string>)));
      if (detalles.length > 0) {
        message = detalles.join('. ') + '.';
      }
    }

    if (response.status === 401) {
      localStorage.removeItem('agendapro_token');
      localStorage.removeItem('agendapro_user');
      localStorage.removeItem('agendapro_role');
    }

    throw new Error(message);
  }

  return body as T;
}

export async function login(correo: string, contrasena: string) {
  return request<LoginResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ correo, contrasena }),
    },
    false
  );
}

export async function register(data: RegisterRequest) {
  return request<ApiUser>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    false
  );
}

/** HU04: solicita el envío del enlace de recuperación al correo registrado. */
export async function solicitarRecuperacion(correo: string) {
  return request<void>(
    '/auth/recuperar',
    {
      method: 'POST',
      body: JSON.stringify({ correo }),
    },
    false
  );
}

/** HU04: usa el token recibido para definir una nueva contraseña. */
export async function restablecerContrasena(
  token: string,
  nuevaContrasena: string,
  confirmarContrasena: string
) {
  return request<void>(
    '/auth/restablecer',
    {
      method: 'POST',
      body: JSON.stringify({ token, nuevaContrasena, confirmarContrasena }),
    },
    false
  );
}

export async function getCatalogServices() {
  return request<ApiService[]>('/catalogo/servicios');
}

export async function getMyServices() {
  return request<ApiProviderService[]>('/servicios/mis-servicios');
}

export async function createService(data: {
  nombre: string;
  descripcion: string;
  duracionMin: number;
  precio: number;
}) {
  return request<ApiProviderService>('/servicios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateService(
  id: number,
  data: {
    nombre: string;
    descripcion: string;
    duracionMin: number;
    precio: number;
    estado?: 'ACTIVO' | 'INACTIVO';
  }
) {
  return request<ApiProviderService>(`/servicios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** HU06 (Sprint 2): baja lógica de un servicio propio. */
export async function deleteService(id: number) {
  return request<void>(`/servicios/${id}`, {
    method: 'DELETE',
  });
}

export async function getAvailableSlots(serviceId: number) {
  return request<ApiSlot[]>(`/catalogo/servicios/${serviceId}/franjas`);
}

export async function getMyServiceSlots(serviceId: number) {
  return request<ApiSlot[]>(`/servicios/${serviceId}/franjas`);
}

export async function createSlot(
  serviceId: number,
  data: {
    inicio: string;
    fin: string;
    cupoTotal?: number;
  }
) {
  return request<ApiSlot>(`/servicios/${serviceId}/franjas`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** HU12: publica varias franjas de una vez siguiendo un patrón semanal. */
export async function createRecurringSlots(
  serviceId: number,
  data: {
    horaInicio: string; // "HH:mm"
    horaFin: string;
    diasSemana: string[]; // nombres de java.time.DayOfWeek, ej. "MONDAY"
    repetirHasta: string; // "YYYY-MM-DD"
    cupoTotal?: number;
  }
) {
  return request<ApiSlot[]>(`/servicios/${serviceId}/franjas/recurrentes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteSlot(slotId: number) {
  return request<ApiSlot>(`/franjas/${slotId}`, {
    method: 'DELETE',
  });
}

export async function createBooking(franjaId: number) {
  return request<ApiBooking>('/reservas', {
    method: 'POST',
    body: JSON.stringify({ franjaId }),
  });
}

export async function cancelBooking(reservaId: number) {
  return request<ApiBooking>(`/reservas/${reservaId}/cancelar`, {
    method: 'PUT',
  });
}

/** HU16: reprograma una reserva propia a una nueva franja del mismo servicio. */
export async function rescheduleBooking(reservaId: number, nuevaFranjaId: number) {
  return request<ApiBooking>(`/reservas/${reservaId}/reprogramar`, {
    method: 'PUT',
    body: JSON.stringify({ nuevaFranjaId }),
  });
}

/** HU17: agenda vigente. HU18: con filtros opcionales por fecha y/o servicio. */
export async function getAgenda(fecha?: string, servicioId?: number) {
  const params = new URLSearchParams();
  if (fecha) params.set('fecha', fecha);
  if (servicioId) params.set('servicioId', String(servicioId));
  const query = params.toString();
  return request<ApiBooking[]>(`/agenda${query ? `?${query}` : ''}`);
}

/** HU03: perfil del usuario autenticado. */
export async function getProfile() {
  return request<ApiUser>('/usuarios/me');
}

export async function updateProfile(data: { nombre: string; correo: string; telefono: string }) {
  return request<ApiUser>('/usuarios/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------- Servidor

/**
 * Hace una petición liviana para "despertar" el backend. En el plan gratuito de Render el
 * servidor se apaga tras 15 minutos sin uso y tarda cerca de un minuto en arrancar; llamarlo
 * al abrir la página adelanta ese arranque mientras el usuario escribe sus datos.
 */
export function despertarServidor(): void {
  fetch(`${API_URL}/salud`).catch(() => {
    // Si falla no pasa nada: la siguiente petición real mostrará el error correspondiente.
  });
}

// ---------------------------------------------------------------- HU07-HU09 Recursos

export type TipoRecurso = 'ESPACIO' | 'EQUIPO' | 'PERSONAL' | 'OTRO';

export interface ApiRecurso {
  id: number;
  nombre: string;
  tipo: TipoRecurso;
  descripcion: string | null;
  capacidad: number;
  servicios: { id: number; nombre: string; estado: string }[];
  /** Reservas confirmadas futuras que usan el recurso. */
  reservasProximas: number;
  /** Mayor número de esas reservas que coinciden al mismo tiempo. */
  ocupacionMaxima: number;
  /** Cupos que quedan en el momento más ocupado. */
  cuposLibresEnPico: number;
}

export interface RecursoPayload {
  nombre: string;
  tipo: TipoRecurso;
  descripcion: string;
  capacidad: number;
}

export interface ApiDisponibilidadRecurso {
  recursoId: number;
  recurso: string;
  capacidad: number;
  fecha: string;
  horarios: {
    franjaId: number;
    servicioId: number;
    servicio: string;
    inicio: string;
    fin: string;
    reservasSimultaneas: number;
    cuposDisponibles: number;
  }[];
}

export async function getRecursos() {
  return request<ApiRecurso[]>('/recursos');
}

export async function createRecurso(data: RecursoPayload) {
  return request<ApiRecurso>('/recursos', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateRecurso(id: number, data: RecursoPayload) {
  return request<ApiRecurso>(`/recursos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteRecurso(id: number) {
  return request<void>(`/recursos/${id}`, { method: 'DELETE' });
}

export async function getDisponibilidadRecurso(id: number, fecha: string) {
  return request<ApiDisponibilidadRecurso>(`/recursos/${id}/disponibilidad?fecha=${encodeURIComponent(fecha)}`);
}

export async function getRecursosDeServicio(servicioId: number) {
  return request<ApiRecurso[]>(`/servicios/${servicioId}/recursos`);
}

export async function asociarRecurso(servicioId: number, recursoId: number) {
  return request<ApiRecurso>(`/servicios/${servicioId}/recursos/${recursoId}`, { method: 'POST' });
}

export async function desasociarRecurso(servicioId: number, recursoId: number) {
  return request<void>(`/servicios/${servicioId}/recursos/${recursoId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------- HU20-HU23 Informes

export interface ApiInforme {
  desde: string;
  hasta: string;
  servicioId: number | null;
  servicio: string | null;
  resumen: {
    reservas: number;
    canceladas: number;
    cuposPublicados: number;
    cuposReservados: number;
    cuposDisponibles: number;
    porcentajeOcupacion: number | null;
    ingresosEstimados: number;
  };
  porServicio: {
    servicioId: number;
    servicio: string;
    reservas: number;
    canceladas: number;
    cuposPublicados: number;
    cuposReservados: number;
    porcentajeOcupacion: number | null;
  }[];
  reservas: {
    reservaId: number;
    inicio: string;
    fin: string;
    servicioId: number;
    servicio: string;
    cliente: string;
    estado: 'CONFIRMADA' | 'CANCELADA';
    precio: number;
  }[];
}

export async function getInforme(desde: string, hasta: string, servicioId?: number) {
  const params = new URLSearchParams({ desde, hasta });
  if (servicioId) params.set('servicioId', String(servicioId));
  return request<ApiInforme>(`/informes?${params.toString()}`);
}
