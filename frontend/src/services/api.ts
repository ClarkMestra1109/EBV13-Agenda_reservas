const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface ApiUser {
  id: number;
  nombre: string;
  correo: string;
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

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === 'object' && body
        ? body.mensaje || body.message || 'La operación no pudo completarse'
        : body || 'La operación no pudo completarse';

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

export async function getAgenda() {
  return request<ApiBooking[]>('/agenda');
}
