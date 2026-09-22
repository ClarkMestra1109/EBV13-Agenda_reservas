export type UserRole = 'provider' | 'client';

export type CurrentView =
  | 'login'
  | 'provider-dashboard'
  | 'provider-reservations'
  | 'provider-agenda'
  | 'provider-services'
  | 'provider-availability'
  | 'client-dashboard'
  | 'client-explore'
  | 'client-booking'
  | 'client-reservations'; 

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientInitials: string;
  clientAvatar?: string;
  serviceId: string;
  serviceTitle: string;
  category: string;
  locationName: string;
  date: string; // e.g. 'Hoy, 24 Oct' or '2024-10-27'
  time: string; // e.g. '10:00 AM'
  timeSlotFormatted: string; // e.g. 'Hoy, 10:00 AM'
  durationMinutes: number;
  price: number;
  status: BookingStatus;
  notes?: string;
  modality: 'Presencial' | 'Virtual' | 'A domicilio';
  meetingUrl?: string;
  isVirtual?: boolean;
  backendInicio?: string;
  backendFin?: string;
  franjaId?: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  providerName: string;
  providerStudio: string;
  modalityBadge: string;
  price: number;
  durationMinutes: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  description: string;
  isActive: boolean;
  backendId?: number;
  backendProviderName?: string;
}

export interface AvailabilitySlot {
  id: string;
  dayLabel: 'HOY' | 'MAÑ' | 'VIE' | 'SÁB' | 'DOM';
  fullDate: string;
  timeRange: string;
  capacityText: string;
  serviceTag: string;
  isBooked: boolean;
  serviceId?: string;
  inicio?: string;
  fin?: string;
  cupoTotal?: number;
  cuposDisponibles?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  client: string;
  timeRange: string;
  day: string;
  startHour: number; // e.g. 10.0 for 10:00 AM, 14.5 for 2:30 PM
  durationHours: number; // e.g. 0.75, 1, 2
  status: 'confirmed' | 'pending' | 'available' | 'blocked';
  color: string;
  price?: string;
  location?: string;
}
