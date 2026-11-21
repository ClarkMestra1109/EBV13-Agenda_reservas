import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  UserRole,
  CurrentView,
  Booking,
  ServiceItem,
  AvailabilitySlot,
  CalendarEvent,
} from './types';
import {
  ApiBooking,
  ApiProviderService,
  ApiService,
  ApiSlot,
  ApiUser,
  cancelBooking,
  createBooking,
  createRecurringSlots,
  createService,
  createSlot,
  deleteService,
  deleteSlot,
  getProfile,
  rescheduleBooking,
  updateProfile,
  updateService,
  getAgenda,
  getAvailableSlots,
  getCatalogServices,
  getMyServiceSlots,
  getMyServices,
  despertarServidor,
  login,
  register,
  solicitarRecuperacion,
  restablecerContrasena,
} from './services/api';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginScreen } from './components/screens/LoginScreen';
import { ForgotPasswordScreen } from './components/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './components/screens/ResetPasswordScreen';
import { ProviderDashboard } from './components/screens/ProviderDashboard';
import { ProviderReservations } from './components/screens/ProviderReservations';
import { ProviderAgenda } from './components/screens/ProviderAgenda';
import { ProviderServices } from './components/screens/ProviderServices';
import { ProviderAvailability } from './components/screens/ProviderAvailability';
import { ProviderAnalytics } from './components/screens/ProviderAnalytics';
import { ProviderResources } from './components/screens/ProviderResources';
import { ClientDashboard } from './components/screens/ClientDashboard';
import { ClientExplore } from './components/screens/ClientExplore';
import { ClientBooking } from './components/screens/ClientBooking';
import { ClientReservations } from './components/screens/ClientReservations';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { BookingConfirmationModal } from './components/modals/BookingConfirmationModal';
import { CancelBookingModal } from './components/modals/CancelBookingModal';
import { RescheduleBookingModal } from './components/modals/RescheduleBookingModal';
import { NewServiceModal, ServicioFormData } from './components/modals/NewServiceModal';
import { NewSlotModal, NuevaFranjaRecurrentePayload } from './components/modals/NewSlotModal';
import { SharePublicLinkModal } from './components/modals/SharePublicLinkModal';
import {
  deleteServiceImage,
  deleteServiceMetadata,
  getServiceImage,
  getServiceMetadata,
  saveServiceImage,
  saveServiceMetadata,
} from './services/serviceImages';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const DIAS_JAVA = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const toFrontendRole = (rol: ApiUser['rol']): UserRole =>
  rol === 'PROVEEDOR' ? 'provider' : 'client';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Bogota',
  }).format(new Date(iso));

const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
    .format(new Date(iso))
    .replace('.', '');

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));

const formatCalendarDay = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: '2-digit',
    timeZone: 'America/Bogota',
  })
    .format(new Date(iso))
    .replace('.', '');

const formatAgendaTime = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  }).format(new Date(iso));

const getAgendaHour = (iso: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
    timeZone: 'America/Bogota',
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  return hour + minute / 60;
};

// Etiqueta corta del día en hora de Colombia: HOY, MAÑANA o el día de la semana (LUN, MAR...).
const getDayLabel = (iso: string): string => {
  const dia = (fecha: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(fecha);
  const objetivo = dia(new Date(iso));
  const hoy = new Date();
  if (objetivo === dia(hoy)) return 'HOY';
  if (objetivo === dia(new Date(hoy.getTime() + 86_400_000))) return 'MAÑANA';
  return new Intl.DateTimeFormat('es-CO', { weekday: 'short', timeZone: 'America/Bogota' })
    .format(new Date(iso))
    .replace('.', '')
    .toUpperCase();
};

const mapCatalogService = (service: ApiService): ServiceItem => ({
  id: String(service.id),
  title: service.nombre,
  category: 'Servicios',
  categorySlug: 'general',
  providerName: service.proveedorNombre,
  providerStudio: service.proveedorNombre,
  providerBusinessName: service.nombreComercial || undefined,
  providerBusinessSector: service.sectorActividad || undefined,
  providerBusinessDescription: service.descripcionComercial || undefined,
  providerBusinessWebsite: service.sitioWeb || undefined,
  modalityBadge: 'Presencial',
  serviceMode: 'Presencial',
  serviceLocation: '',
  price: Number(service.precio),
  durationMinutes: service.duracionMin,
  imageUrl: '',
  description: service.descripcion,
  isActive: true,
  backendId: service.id,
  backendProviderName: service.proveedorNombre,
});

const mapProviderService = (service: ApiProviderService): ServiceItem => ({
  id: String(service.id),
  title: service.nombre,
  category: 'Servicios',
  categorySlug: 'general',
  providerName: '',
  providerStudio: '',
  modalityBadge: 'Presencial',
  serviceMode: 'Presencial',
  serviceLocation: '',
  price: Number(service.precio),
  durationMinutes: service.duracionMin,
  imageUrl: '',
  description: service.descripcion,
  isActive: service.estado === 'ACTIVO',
  backendId: service.id,
});

const mapSlot = (slot: ApiSlot, service?: ServiceItem): AvailabilitySlot => ({
  id: String(slot.id),
  dayLabel: getDayLabel(slot.inicio),
  fullDate: formatDate(slot.inicio),
  timeRange: `${formatTime(slot.inicio)} - ${formatTime(slot.fin)}`,
  capacityText: `${slot.cuposDisponibles} cupo${slot.cuposDisponibles === 1 ? '' : 's'} libre${slot.cuposDisponibles === 1 ? '' : 's'}`,
  serviceTag: service?.title || `Servicio #${slot.servicioId}`,
  isBooked: slot.cuposDisponibles <= 0,
  serviceId: String(slot.servicioId),
  inicio: slot.inicio,
  fin: slot.fin,
  cupoTotal: slot.cupoTotal,
  cuposDisponibles: slot.cuposDisponibles,
});

const mapBooking = (
  booking: ApiBooking,
  services: ServiceItem[],
  currentUser: ApiUser | null
): Booking => {
  const service = services.find(
    (item) => item.backendId === booking.servicioId || item.id === String(booking.servicioId)
  );

  const isClient = currentUser?.rol === 'CLIENTE';

  return {
    id: String(booking.id),
    clientName: booking.clienteNombre || (isClient ? currentUser?.nombre || '' : ''),
    clientEmail: isClient ? currentUser?.correo || '' : '',
    clientPhone: '',
    clientInitials: (booking.clienteNombre || 'CL')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    serviceId: String(booking.servicioId),
    serviceTitle: booking.servicioNombre,
    category: service?.category || 'Servicios',
    locationName: booking.proveedorNombre,
    date: formatDate(booking.inicio),
    time: formatTime(booking.inicio),
    timeSlotFormatted: `${formatShortDate(booking.inicio)} • ${formatTime(booking.inicio)}`,
    durationMinutes: service
      ? Math.max(
          1,
          Math.round(
            (new Date(booking.fin).getTime() - new Date(booking.inicio).getTime()) / 60000
          )
        )
      : 0,
    price: service?.price || 0,
    status: booking.estado === 'CANCELADA' ? 'cancelled' : 'confirmed',
    modality: service?.serviceMode || 'Presencial',
    serviceLocation: service?.serviceLocation || '',
    backendInicio: booking.inicio,
    backendFin: booking.fin,
    franjaId: booking.franjaId,
  };
};

const buildCalendarEvents = (
  bookings: Booking[],
  slots: AvailabilitySlot[]
): CalendarEvent[] => {
  const bookingEvents = bookings
    .filter((booking) => booking.status === 'confirmed' && booking.backendInicio && booking.backendFin)
    .map((booking) => {
      const startDate = new Date(booking.backendInicio!);
      const endDate = new Date(booking.backendFin!);
      const startHours = getAgendaHour(booking.backendInicio!);
      const durationHours = Math.max(0.25, (endDate.getTime() - startDate.getTime()) / 3600000);

      return {
        id: `booking-${booking.id}`,
        title: booking.serviceTitle,
        client: booking.clientName || 'Cliente',
        timeRange: `${formatAgendaTime(booking.backendInicio!)} - ${formatAgendaTime(booking.backendFin!)}`,
        day: formatCalendarDay(booking.backendInicio!),
        bookingId: booking.id,
        serviceId: booking.serviceId,
        startAt: booking.backendInicio!,
        endAt: booking.backendFin!,
        startHour: startHours,
        durationHours,
        status: 'confirmed',
        color: 'bg-emerald-100 border-emerald-400 text-emerald-900',
        price: `$${booking.price.toLocaleString('es-CO')} COP`,
        location: booking.locationName,
      } as CalendarEvent;
    });

  const slotEvents = slots
    .filter((slot) => !slot.isBooked && slot.inicio && slot.fin)
    .map((slot) => {
      const startDate = new Date(slot.inicio!);
      const endDate = new Date(slot.fin!);

      return {
        id: `slot-${slot.id}`,
        title: slot.serviceTag || 'Horario disponible',
        client: `${slot.cuposDisponibles || 1} cupo${slot.cuposDisponibles === 1 ? '' : 's'} disponible${slot.cuposDisponibles === 1 ? '' : 's'}`,
        timeRange: `${formatAgendaTime(slot.inicio!)} - ${formatAgendaTime(slot.fin!)}`,
        day: formatCalendarDay(slot.inicio!),
        slotId: slot.id,
        serviceId: slot.serviceId,
        startAt: slot.inicio!,
        endAt: slot.fin!,
        startHour: getAgendaHour(slot.inicio!),
        durationHours: Math.max(0.25, (endDate.getTime() - startDate.getTime()) / 3600000),
        status: 'available',
        color: 'bg-blue-50 border-blue-400 text-blue-800',
      } as CalendarEvent;
    });

  return [...bookingEvents, ...slotEvents];
};

export function App() {
  const [user, setUser] = useState<ApiUser | null>(() => {
    const saved = localStorage.getItem('agendapro_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [role, setRole] = useState<UserRole>(() =>
    user ? toFrontendRole(user.rol) : 'provider'
  );

  // HU04: si el enlace de recuperación trae ?token=..., abrimos directo la pantalla de
  // restablecer contraseña, sin importar si hay una sesión activa.
  const [resetToken] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  });

  const [currentView, setCurrentView] = useState<CurrentView>(() => {
    if (resetToken) return 'reset-password';
    return user
      ? toFrontendRole(user.rol) === 'provider'
        ? 'provider-dashboard'
        : 'client-dashboard'
      : 'login';
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedServiceToBook, setSelectedServiceToBook] = useState<ServiceItem | null>(null);
  const [confirmedBookingForModal, setConfirmedBookingForModal] = useState<Booking | null>(null);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [bookingToReschedule, setBookingToReschedule] = useState<Booking | null>(null);
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null);
  const [isNewSlotOpen, setIsNewSlotOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingsReady, setBookingsReady] = useState(false);

  const [toastType, setToastType] = useState<'ok' | 'error'>('ok');
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = (msg: string, type: 'ok' | 'error' = 'ok') => {
    setToastMessage(msg);
    setToastType(type);
    // Un aviso nuevo reemplaza al anterior y reinicia su temporizador. Los errores
    // permanecen más tiempo en pantalla para que alcancen a leerse.
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(
      () => setToastMessage(null),
      type === 'error' ? 6000 : 3500
    );
  };

  const loadData = async (loggedUser: ApiUser) => {
    setIsLoading(true);

    try {
      const frontendRole = toFrontendRole(loggedUser.rol);

      if (frontendRole === 'provider') {
        const providerServicesApi = await getMyServices();
        // HU06: los servicios con baja lógica (ELIMINADO) no deben seguir apareciendo en
        // "Mis Servicios" ni en la disponibilidad, aunque el backend todavía los devuelva
        // (se conservan para no perder el historial de reservas pasadas).
        const activeProviderServicesApi = providerServicesApi.filter(
          (service) => service.estado !== 'ELIMINADO'
        );
        const providerServices = activeProviderServicesApi.map(mapProviderService);
        try {
          const storedData = await Promise.all(
            activeProviderServicesApi.map(async (service) => ({
              imageUrl: await getServiceImage(service.id),
              metadata: await getServiceMetadata(service.id),
            }))
          );
          providerServices.forEach((service, index) => {
            const data = storedData[index];
            service.imageUrl = data.imageUrl || '';
            service.serviceMode = data.metadata?.mode || 'Presencial';
            service.serviceLocation = data.metadata?.location || '';
            service.modalityBadge = service.serviceMode;
          });
        } catch (err) {
          showToast(
            `No fue posible cargar fotos y configuración local de servicios: ${
              err instanceof Error ? err.message : 'error de almacenamiento'
            }`,
            'error'
          );
        }
        setServices(providerServices);

        const allSlots = (
          await Promise.all(
            activeProviderServicesApi.map((service) => getMyServiceSlots(service.id))
          )
        )
          .flat()
          .filter((slot) => slot.estado === 'PUBLICADA')
          .map((slot) =>
            mapSlot(
              slot,
              providerServices.find((service) => service.backendId === slot.servicioId)
            )
          );

        setSlots(allSlots);

        const agenda = await getAgenda();
        setBookings(agenda.map((item) => mapBooking(item, providerServices, loggedUser)));
        setBookingsReady(true);
      } else {
        const catalog = await getCatalogServices();
        const catalogServices = catalog.map(mapCatalogService);
        try {
          const storedData = await Promise.all(
            catalog.map(async (service) => ({
              imageUrl: await getServiceImage(service.id),
              metadata: await getServiceMetadata(service.id),
            }))
          );
          catalogServices.forEach((service, index) => {
            const data = storedData[index];
            service.imageUrl = data.imageUrl || '';
            service.serviceMode = data.metadata?.mode || 'Presencial';
            service.serviceLocation = data.metadata?.location || '';
            service.modalityBadge = service.serviceMode;
          });
        } catch (err) {
          showToast(
            `No fue posible cargar fotos y configuración local de servicios: ${
              err instanceof Error ? err.message : 'error de almacenamiento'
            }`,
            'error'
          );
        }
        setServices(catalogServices);
        setSlots([]);

        const agenda = await getAgenda();
        setBookings(agenda.map((item) => mapBooking(item, catalogServices, loggedUser)));
        setBookingsReady(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible cargar los datos';
      showToast(message, 'error');

      if (!localStorage.getItem('agendapro_token')) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Despierta el servidor apenas se abre la página (ver despertarServidor).
  useEffect(() => {
    despertarServidor();
  }, []);

  useEffect(() => {
    if (user && localStorage.getItem('agendapro_token')) {
      loadData(user);
    }
  }, [user]);

  useEffect(() => {
    if (!user || role !== 'provider') return;

    let active = true;
    let refreshing = false;
    let hasReportedError = false;

    const refreshProviderBookings = async () => {
      if (!active || refreshing || document.visibilityState === 'hidden') return;
      refreshing = true;
      try {
        const agenda = await getAgenda();
        if (active) {
          setBookings(agenda.map((item) => mapBooking(item, services, user)));
          setBookingsReady(true);
          hasReportedError = false;
        }
      } catch (err) {
        if (active && !hasReportedError) {
          showToast(
            `No fue posible actualizar las reservas: ${
              err instanceof Error ? err.message : 'error de conexión'
            }`,
            'error'
          );
          hasReportedError = true;
        }
      } finally {
        refreshing = false;
      }
    };

    const intervalId = window.setInterval(refreshProviderBookings, 30_000);
    window.addEventListener('focus', refreshProviderBookings);
    document.addEventListener('visibilitychange', refreshProviderBookings);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshProviderBookings);
      document.removeEventListener('visibilitychange', refreshProviderBookings);
    };
  }, [user, role, services]);

  const handleLogin = async (email: string, password: string) => {
    const response = await login(email, password);

    localStorage.setItem('agendapro_token', response.token);
    localStorage.setItem('agendapro_user', JSON.stringify(response.usuario));
    localStorage.setItem('agendapro_role', response.usuario.rol);

    setUser(response.usuario);
    setRole(toFrontendRole(response.usuario.rol));
    setCurrentView(
      response.usuario.rol === 'PROVEEDOR' ? 'provider-dashboard' : 'client-dashboard'
    );
    showToast(`Bienvenido, ${response.usuario.nombre}`);
  };

  const handleRegister = async (
    name: string,
    email: string,
    password: string,
    selectedRole: UserRole
  ) => {
    const backendRole = selectedRole === 'provider' ? 'PROVEEDOR' : 'CLIENTE';

    await register({
      nombre: name,
      correo: email,
      contrasena: password,
      rol: backendRole,
    });

    await handleLogin(email, password);
  };

  /** HU04: pide el enlace de recuperación al correo registrado. */
  const handleForgotPassword = async (correo: string) => {
    await solicitarRecuperacion(correo);
  };

  /** HU04: usa el token para definir una nueva contraseña. */
  const handleResetPassword = async (
    token: string,
    nuevaContrasena: string,
    confirmarContrasena: string
  ) => {
    await restablecerContrasena(token, nuevaContrasena, confirmarContrasena);
  };

  const goToLoginFromRecovery = () => {
    // Limpia el ?token= de la URL para que un refresh no vuelva a abrir esta pantalla.
    window.history.replaceState({}, '', window.location.pathname);
    setCurrentView('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('agendapro_token');
    localStorage.removeItem('agendapro_user');
    localStorage.removeItem('agendapro_role');

    setUser(null);
    setRole('provider');
    setServices([]);
    setSlots([]);
    setBookings([]);
    setBookingsReady(false);
    setCurrentView('login');
    showToast('Sesión cerrada con éxito');
  };

  const handleSwitchRole = () => {
    showToast('El rol está asociado a la cuenta. Cierra sesión para entrar con otra cuenta.');
  };

  const handleConfirmBooking = async (bookingId: string) => {
    showToast(
      `La reserva #${bookingId} ya está confirmada: las reservas se confirman automáticamente y no requieren aprobación manual.`,
            'ok'
          );
  };

  const handleCancelBooking = (booking: Booking) => {
    if (role === 'provider') {
      showToast('Solo el cliente dueño de la reserva puede cancelarla.', 'error');
      return;
    }

    setBookingToCancel(booking);
  };

  const handleConfirmCancelModal = async (bookingId: string, reason: string) => {
    try {
      const response = await cancelBooking(Number(bookingId));

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: 'cancelled',
                notes: reason,
                date: formatDate(response.inicio),
                time: formatTime(response.inicio),
              }
            : booking
        )
      );

      setBookingToCancel(null);
      showToast('Reserva cancelada y cupo liberado en el sistema.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No fue posible cancelar la reserva', 'error');
    }
  };

  const handleOpenReschedule = (booking: Booking) => {
    if (role === 'provider') {
      showToast('Solo el cliente dueño de la reserva puede reprogramarla.', 'error');
      return;
    }
    setBookingToReschedule(booking);
  };

  const handleLoadRescheduleSlots = async (servicioId: number): Promise<AvailabilitySlot[]> => {
    const franjas = await getAvailableSlots(servicioId);
    const service = services.find((item) => item.backendId === servicioId);
    return franjas.map((slot) => mapSlot(slot, service));
  };

  const handleConfirmReschedule = async (bookingId: string, newSlotId: string) => {
    await rescheduleBooking(Number(bookingId), Number(newSlotId));
    showToast('Reserva reprogramada con éxito.');
    setBookingToReschedule(null);
    await loadData(user!);
  };

  const handleUpdateProfile = async (data: { nombre: string; correo: string; telefono: string }) => {
    const updated = await updateProfile(data);
    localStorage.setItem('agendapro_user', JSON.stringify(updated));
    setUser(updated);
    showToast('Perfil actualizado con éxito.');
  };

  // Si el backend rechaza el patrón, el error se propaga al modal para mostrarse dentro del
  // formulario (sin cerrarlo ni perder lo que el usuario escribió).
  const handleAddRecurringSlots = async (payload: NuevaFranjaRecurrentePayload) => {
    const diasSemana = payload.diasSemana.map((dia) => DIAS_JAVA[dia]);
    const created = await createRecurringSlots(Number(payload.serviceId), {
      horaInicio: payload.horaInicio,
      horaFin: payload.horaFin,
      diasSemana,
      repetirHasta: payload.repetirHasta,
      cupoTotal: payload.cupoTotal,
    });

    const service = services.find((item) => item.id === payload.serviceId);
    const mapped = created.map((slot) => mapSlot(slot, service));
    setSlots((prev) => [...mapped, ...prev]);
    setIsNewSlotOpen(false);
    showToast(
      created.length === 1
        ? '1 horario publicado con éxito.'
        : `${created.length} horarios publicados con éxito.`
    );
  };

  const handleNewBookingCreated = async (newBooking: Booking) => {
    setBookings((prev) =>
      prev.some((booking) => booking.id === newBooking.id)
        ? prev
        : [newBooking, ...prev]
    );
    setConfirmedBookingForModal(newBooking);
    showToast('¡Reserva registrada con éxito! Ya aparece en Mis reservas.');
    await loadData(user!);
  };

  const handleAddService = async (data: ServicioFormData) => {
    const created = await createService({
      nombre: data.title,
      descripcion: data.description,
      duracionMin: data.durationMinutes,
      precio: data.price,
    });

    let imageUrl = '';
    const storageErrors: string[] = [];
    if (data.imageDataUrl) {
      try {
        await saveServiceImage(created.id, data.imageDataUrl);
        imageUrl = data.imageDataUrl;
      } catch (err) {
        storageErrors.push(err instanceof Error ? err.message : 'No fue posible guardar la foto.');
      }
    }
    try {
      await saveServiceMetadata(created.id, { mode: data.mode, location: data.location });
    } catch (err) {
      storageErrors.push(err instanceof Error ? err.message : 'No fue posible guardar modalidad y ubicación.');
    }

    const mapped = {
      ...mapProviderService(created),
      imageUrl,
      serviceMode: data.mode,
      modalityBadge: data.mode,
      serviceLocation: data.location,
    };
    setServices((prev) => [mapped, ...prev]);
    showToast(
      storageErrors.length
        ? `Servicio publicado, pero hubo un problema guardando datos locales: ${storageErrors.join(' ')}`
        : `Servicio "${created.nombre}" publicado en tu catálogo.`,
      storageErrors.length ? 'error' : 'ok'
    );
  };

  const handleUpdateServiceDetails = async (id: string, data: ServicioFormData) => {
    const existing = services.find((s) => s.id === id);

    const updated = await updateService(Number(id), {
      nombre: data.title,
      descripcion: data.description,
      duracionMin: data.durationMinutes,
      precio: data.price,
      estado: existing?.isActive === false ? 'INACTIVO' : 'ACTIVO',
    });

    let imageUrl = existing?.imageUrl || '';
    const storageErrors: string[] = [];
    try {
      if (data.imageDataUrl === null) {
        await deleteServiceImage(id);
        imageUrl = '';
      } else if (data.imageDataUrl) {
        await saveServiceImage(id, data.imageDataUrl);
        imageUrl = data.imageDataUrl;
      }
    } catch (err) {
      storageErrors.push(err instanceof Error ? err.message : 'No fue posible actualizar la foto.');
    }
    try {
      await saveServiceMetadata(id, { mode: data.mode, location: data.location });
    } catch (err) {
      storageErrors.push(err instanceof Error ? err.message : 'No fue posible actualizar modalidad y ubicación.');
    }

    const mapped = {
      ...mapProviderService(updated),
      imageUrl,
      serviceMode: data.mode,
      modalityBadge: data.mode,
      serviceLocation: data.location,
    };
    setServices((prev) => prev.map((s) => (s.id === id ? mapped : s)));
    showToast(
      storageErrors.length
        ? `Servicio actualizado, pero hubo un problema guardando datos locales: ${storageErrors.join(' ')}`
        : `Servicio "${updated.nombre}" actualizado.`,
      storageErrors.length ? 'error' : 'ok'
    );
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteService(Number(id));
      let imageCleanupError: string | null = null;
      try {
        await deleteServiceImage(id);
      } catch (err) {
        imageCleanupError = err instanceof Error ? err.message : 'No fue posible quitar la foto guardada.';
      }
      try {
        await deleteServiceMetadata(id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No fue posible quitar los datos guardados.';
        imageCleanupError = imageCleanupError ? `${imageCleanupError} ${message}` : message;
      }
      setServices((prev) => prev.filter((s) => s.id !== id));
      setSlots((prev) => prev.filter((s) => s.serviceId !== id));
      showToast(
        imageCleanupError
          ? `Servicio eliminado, pero no se pudo limpiar su foto: ${imageCleanupError}`
          : 'Servicio eliminado.',
        imageCleanupError ? 'error' : 'ok'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No fue posible eliminar el servicio', 'error');
    }
  };

  const handleOpenCreateService = () => {
    setServiceToEdit(null);
    setIsNewServiceOpen(true);
  };

  const handleOpenEditService = (service: ServiceItem) => {
    setServiceToEdit(service);
    setIsNewServiceOpen(true);
  };

  // Igual que en la publicación recurrente: los errores se muestran dentro del modal.
  const handleAddSlot = async (slot: AvailabilitySlot) => {
    if (!slot.serviceId || !slot.inicio || !slot.fin) {
      throw new Error('Debes seleccionar un servicio, fecha, hora de inicio y hora de fin.');
    }

    const created = await createSlot(Number(slot.serviceId), {
      inicio: slot.inicio,
      fin: slot.fin,
      cupoTotal: slot.cupoTotal,
    });

    const service = services.find((item) => item.id === slot.serviceId);
    setSlots((prev) => [mapSlot(created, service), ...prev]);
    setIsNewSlotOpen(false);
    showToast('Nuevo horario publicado con éxito.');
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot(Number(slotId));
      setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
      showToast('Franja horaria retirada.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No fue posible retirar la franja', 'error');
    }
  };

  const handleClientSelectService = (service: ServiceItem) => {
    setSelectedServiceToBook(service);
    setCurrentView('client-booking');
  };

  const calendarEvents = useMemo(
    () => buildCalendarEvents(bookings, slots),
    [bookings, slots]
  );

  const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length;
  // Solo horarios futuros con cupo: los que ya pasaron no son reservables.
  const availableSlotsCount = slots.filter(
    (s) => !s.isBooked && (!s.inicio || Date.parse(s.inicio) > Date.now())
  ).length;
  const activeClientBookingsCount = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  ).length;

  return (
    <div className="min-h-screen bg-[#f8faff] text-[#0b1c30] flex flex-col selection:bg-blue-100 selection:text-blue-900 font-sans">
      {toastMessage && (
        <div
          role={toastType === 'error' ? 'alert' : 'status'}
          className={`fixed bottom-5 right-5 z-[70] max-w-sm text-white px-4 py-3 rounded-2xl shadow-xl flex items-start gap-2.5 border animate-in slide-in-from-bottom-3 text-xs font-semibold ${
            toastType === 'error' ? 'bg-red-700 border-red-800' : 'bg-[#0b1c30] border-slate-700'
          }`}
        >
          {toastType === 'error' ? (
            <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {isLoading && user && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-blue-600 animate-pulse" />
      )}

      {currentView === 'forgot-password' ? (
        <ForgotPasswordScreen
          onRequestRecovery={handleForgotPassword}
          onBackToLogin={() => setCurrentView('login')}
        />
      ) : currentView === 'reset-password' ? (
        <ResetPasswordScreen
          initialToken={resetToken}
          onResetPassword={handleResetPassword}
          onBackToLogin={goToLoginFromRecovery}
        />
      ) : currentView === 'login' || !user ? (
        <LoginScreen
          onLogin={handleLogin}
          onRegister={handleRegister}
          onForgotPassword={() => setCurrentView('forgot-password')}
        />
      ) : (
        <div className="flex flex-1 min-h-screen">
          <Sidebar
            role={role}
            userName={user.nombre}
            userEmail={user.correo}
            currentView={currentView}
            onNavigate={setCurrentView}
            onSwitchRole={handleSwitchRole}
            onLogout={handleLogout}
            pendingBookingsCount={pendingBookingsCount}
            activeClientBookingsCount={activeClientBookingsCount}
            servicesCount={services.length}
            availableSlotsCount={availableSlotsCount}
          />

          <div className="flex-1 flex flex-col min-w-0">
            <Header
              role={role}
              userName={user.nombre}
              bookings={bookings}
              bookingsReady={bookingsReady}
              onNavigate={setCurrentView}
              onOpenNewService={handleOpenCreateService}
              onOpenNewSlot={() => setIsNewSlotOpen(true)}
            />

            <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
              {currentView === 'provider-dashboard' && (
                <ProviderDashboard
                  userName={user.nombre}
                  bookings={bookings}
                  services={services}
                  slots={slots}
                  onNavigate={setCurrentView}
                  onOpenNewService={handleOpenCreateService}
                  onOpenNewSlot={() => setIsNewSlotOpen(true)}
                  onConfirmBooking={handleConfirmBooking}
                  onCancelBooking={handleCancelBooking}
                  onOpenShareModal={() => setIsShareModalOpen(true)}
                  onDeleteSlot={handleDeleteSlot}
                />
              )}

              {currentView === 'provider-reservations' && (
                <ProviderReservations
                  bookings={bookings}
                  onConfirmBooking={handleConfirmBooking}
                  onCancelBooking={handleCancelBooking}
                  onNavigate={setCurrentView}
                />
              )}

              {currentView === 'provider-agenda' && (
                <ProviderAgenda
                  events={calendarEvents}
                  services={services}
                  onOpenNewSlot={() => setIsNewSlotOpen(true)}
                  onDeleteSlot={handleDeleteSlot}
                  onRefresh={() => loadData(user)}
                  onNavigate={setCurrentView}
                />
              )}

              {currentView === 'provider-services' && (
                <ProviderServices
                  services={services}
                  onOpenNewService={handleOpenCreateService}
                  onEditService={handleOpenEditService}
                  onNavigate={setCurrentView}
                  onDeleteService={handleDeleteService}
                  onToggleActive={async (id) => {
                    const servicio = services.find((s) => s.id === id);
                    if (!servicio) return;
                    try {
                      const updated = await updateService(Number(id), {
                        nombre: servicio.title,
                        descripcion: servicio.description,
                        duracionMin: servicio.durationMinutes,
                        precio: servicio.price,
                        estado: servicio.isActive ? 'INACTIVO' : 'ACTIVO',
                      });
                      setServices((prev) =>
                      prev.map((s) =>
                        s.id === id
                          ? { ...mapProviderService(updated), imageUrl: s.imageUrl }
                          : s
                      )
                      );
                      showToast('Estado del servicio actualizado.');
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : 'No fue posible actualizar el servicio', 'error');
                    }
                  }}
                />
              )}

              {currentView === 'provider-availability' && (
                <ProviderAvailability
                  slots={slots}
                  onOpenNewSlot={() => setIsNewSlotOpen(true)}
                  onDeleteSlot={handleDeleteSlot}
                  onRefresh={() => loadData(user)}
                />
              )}

              {currentView === 'provider-analytics' && role === 'provider' && (
                <ProviderAnalytics services={services} onNotify={showToast} />
              )}

              {currentView === 'provider-resources' && role === 'provider' && (
                <ProviderResources services={services} onNotify={showToast} />
              )}

              {currentView === 'client-dashboard' && (
                <ClientDashboard
                  userName={user.nombre}
                  bookings={bookings}
                  services={services}
                  onNavigate={setCurrentView}
                  onSelectServiceToBook={handleClientSelectService}
                  onCancelBooking={handleCancelBooking}
                />
              )}

              {currentView === 'client-explore' && (
                <ClientExplore
                  services={services}
                  onNavigate={setCurrentView}
                  onSelectServiceToBook={handleClientSelectService}
                />
              )}

              {currentView === 'client-booking' && selectedServiceToBook && (
                <ClientBooking
                  service={selectedServiceToBook}
                  onNavigate={setCurrentView}
                  onConfirmNewBooking={handleNewBookingCreated}
                />
              )}

              {currentView === 'client-reservations' && (
                <ClientReservations
                  bookings={bookings}
                  onNavigate={setCurrentView}
                  onCancelBooking={handleCancelBooking}
                  onRescheduleBooking={handleOpenReschedule}
                />
              )}

              {currentView === 'profile' && (
                <ProfileScreen user={user} onSave={handleUpdateProfile} />
              )}
            </main>
          </div>
        </div>
      )}

      <BookingConfirmationModal
        booking={confirmedBookingForModal}
        onClose={() => setConfirmedBookingForModal(null)}
        onGoToReservations={() => {
          setConfirmedBookingForModal(null);
          setCurrentView('client-reservations');
        }}
      />

      <CancelBookingModal
        booking={bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirmCancel={handleConfirmCancelModal}
      />

      <RescheduleBookingModal
        booking={bookingToReschedule}
        onClose={() => setBookingToReschedule(null)}
        onLoadSlots={handleLoadRescheduleSlots}
        onConfirmReschedule={handleConfirmReschedule}
      />

      <NewServiceModal
        isOpen={isNewServiceOpen}
        onClose={() => {
          setIsNewServiceOpen(false);
          setServiceToEdit(null);
        }}
        onAddService={handleAddService}
        onUpdateService={handleUpdateServiceDetails}
        serviceToEdit={serviceToEdit}
      />

      <NewSlotModal
        isOpen={isNewSlotOpen}
        services={services}
        onClose={() => setIsNewSlotOpen(false)}
        onAddSlot={handleAddSlot}
        onAddRecurringSlots={handleAddRecurringSlots}
      />

      <SharePublicLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onOpenClientView={() => setCurrentView('client-explore')}
      />
    </div>
  );
}

export default App;
