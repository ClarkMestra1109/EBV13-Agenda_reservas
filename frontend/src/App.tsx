import React, { useEffect, useMemo, useState } from 'react';
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
  login,
  register,
} from './services/api';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginScreen } from './components/screens/LoginScreen';
import { ProviderDashboard } from './components/screens/ProviderDashboard';
import { ProviderReservations } from './components/screens/ProviderReservations';
import { ProviderAgenda } from './components/screens/ProviderAgenda';
import { ProviderServices } from './components/screens/ProviderServices';
import { ProviderAvailability } from './components/screens/ProviderAvailability';
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
import { CheckCircle2 } from 'lucide-react';

const DIAS_JAVA = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const toFrontendRole = (rol: ApiUser['rol']): UserRole =>
  rol === 'PROVEEDOR' ? 'provider' : 'client';

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
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
  })
    .format(new Date(iso))
    .replace('.', '');

const getDayLabel = (iso: string): AvailabilitySlot['dayLabel'] => {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  if (sameDay(date, today)) return 'HOY';
  if (sameDay(date, tomorrow)) return 'MAÑ';

  const day = date.getDay();
  if (day === 5) return 'VIE';
  if (day === 6) return 'SÁB';
  return 'DOM';
};

const mapCatalogService = (service: ApiService): ServiceItem => ({
  id: String(service.id),
  title: service.nombre,
  category: 'Servicios',
  categorySlug: 'general',
  providerName: service.proveedorNombre,
  providerStudio: service.proveedorNombre,
  modalityBadge: 'Presencial',
  price: Number(service.precio),
  durationMinutes: service.duracionMin,
  rating: 5,
  reviewsCount: 0,
  imageUrl:
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&auto=format&fit=crop&q=80',
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
  price: Number(service.precio),
  durationMinutes: service.duracionMin,
  rating: 5,
  reviewsCount: 0,
  imageUrl:
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&auto=format&fit=crop&q=80',
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
    modality: 'Presencial',
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
      const startHours = startDate.getHours() + startDate.getMinutes() / 60;
      const durationHours = Math.max(0.25, (endDate.getTime() - startDate.getTime()) / 3600000);

      return {
        id: `booking-${booking.id}`,
        title: booking.serviceTitle,
        client: booking.clientName || 'Cliente',
        timeRange: `${formatTime(booking.backendInicio!)} - ${formatTime(booking.backendFin!)}`,
        day: formatCalendarDay(booking.backendInicio!),
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
        title: 'Cupo libre publicado',
        client: `${slot.cuposDisponibles || 1} cupo${slot.cuposDisponibles === 1 ? '' : 's'} disponible${slot.cuposDisponibles === 1 ? '' : 's'}`,
        timeRange: `${formatTime(slot.inicio!)} - ${formatTime(slot.fin!)}`,
        day: formatCalendarDay(slot.inicio!),
        startHour: startDate.getHours() + startDate.getMinutes() / 60,
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

  const [currentView, setCurrentView] = useState<CurrentView>(() =>
    user
      ? toFrontendRole(user.rol) === 'provider'
        ? 'provider-dashboard'
        : 'client-dashboard'
      : 'login'
  );

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
        const allProviderServices = providerServicesApi.map(mapProviderService);
        setServices(providerServices);

        const allSlots = (
          await Promise.all(
            activeProviderServicesApi.map((service) => getMyServiceSlots(service.id))
          )
        )
          .flat()
          .map((slot) =>
            mapSlot(
              slot,
              providerServices.find((service) => service.backendId === slot.servicioId)
            )
          );

        setSlots(allSlots);

        const agenda = await getAgenda();
        setBookings(agenda.map((item) => mapBooking(item, allProviderServices, loggedUser)));
      } else {
        const catalog = await getCatalogServices();
        const catalogServices = catalog.map(mapCatalogService);
        setServices(catalogServices);
        setSlots([]);

        const agenda = await getAgenda();
        setBookings(agenda.map((item) => mapBooking(item, catalogServices, loggedUser)));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible cargar los datos';
      showToast(message);

      if (!localStorage.getItem('agendapro_token')) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && localStorage.getItem('agendapro_token')) {
      loadData(user);
    }
  }, [user]);

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

  const handleLogout = () => {
    localStorage.removeItem('agendapro_token');
    localStorage.removeItem('agendapro_user');
    localStorage.removeItem('agendapro_role');

    setUser(null);
    setRole('provider');
    setServices([]);
    setSlots([]);
    setBookings([]);
    setCurrentView('login');
    showToast('Sesión cerrada con éxito');
  };

  const handleSwitchRole = () => {
    showToast('El rol está asociado a la cuenta. Cierra sesión para entrar con otra cuenta.');
  };

  const handleConfirmBooking = async (bookingId: string) => {
    showToast('Las reservas se confirman automáticamente por el backend. No requieren aprobación manual.');
    await loadData(user!);
  };

  const handleCancelBooking = (booking: Booking) => {
    if (role === 'provider') {
      showToast('El backend actual permite cancelar reservas únicamente al cliente dueño.');
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
      showToast(err instanceof Error ? err.message : 'No fue posible cancelar la reserva');
    }
  };

  const handleOpenReschedule = (booking: Booking) => {
    if (role === 'provider') {
      showToast('El backend actual permite reprogramar reservas únicamente al cliente dueño.');
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

  const handleAddRecurringSlots = async (payload: NuevaFranjaRecurrentePayload) => {
    try {
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
      showToast(`${created.length} franja(s) publicadas con éxito (HU12).`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No fue posible publicar las franjas recurrentes');
    }
  };

  const handleFilterAgenda = async (fecha?: string, servicioId?: number): Promise<Booking[]> => {
    const agenda = await getAgenda(fecha, servicioId);
    return agenda.map((item) => mapBooking(item, services, user));
  };

  const handleNewBookingCreated = async (newBooking: Booking) => {
    setConfirmedBookingForModal(newBooking);
    showToast('¡Cita agendada con éxito!');
    await loadData(user!);
  };

  const handleAddService = async (data: ServicioFormData) => {
    const created = await createService({
      nombre: data.title,
      descripcion: data.description,
      duracionMin: data.durationMinutes,
      precio: data.price,
    });

    const mapped = mapProviderService(created);
    setServices((prev) => [mapped, ...prev]);
    showToast(`Servicio "${created.nombre}" publicado en tu catálogo.`);
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

    const mapped = mapProviderService(updated);
    setServices((prev) => prev.map((s) => (s.id === id ? mapped : s)));
    showToast(`Servicio "${updated.nombre}" actualizado.`);
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteService(Number(id));
      setServices((prev) => prev.filter((s) => s.id !== id));
      setSlots((prev) => prev.filter((s) => s.serviceId !== id));
      showToast('Servicio eliminado.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No fue posible eliminar el servicio');
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

  const handleAddSlot = async (slot: AvailabilitySlot) => {
    try {
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
      showToast('Nueva franja horaria publicada con éxito.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No fue posible publicar la franja');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteSlot(Number(slotId));
      setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
      showToast('Franja horaria retirada.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No fue posible retirar la franja');
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
  const availableSlotsCount = slots.filter((s) => !s.isBooked).length;
  const activeClientBookingsCount = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  ).length;

  return (
    <div className="min-h-screen bg-[#f8faff] text-[#0b1c30] flex flex-col selection:bg-blue-100 selection:text-blue-900 font-sans">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0b1c30] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in slide-in-from-bottom-3 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {isLoading && user && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-blue-600 animate-pulse" />
      )}

      {currentView === 'login' || !user ? (
        <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />
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
              currentView={currentView}
              onNavigate={setCurrentView}
              onSwitchRole={handleSwitchRole}
              onOpenNewService={handleOpenCreateService}
              onOpenNewSlot={() => setIsNewSlotOpen(true)}
              onOpenShareModal={() => setIsShareModalOpen(true)}
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
                  bookings={bookings}
                  services={services}
                  onConfirmBooking={handleConfirmBooking}
                  onCancelBooking={handleCancelBooking}
                  onOpenNewSlot={() => setIsNewSlotOpen(true)}
                  onFilterAgenda={handleFilterAgenda}
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
                        prev.map((s) => (s.id === id ? mapProviderService(updated) : s))
                      );
                      showToast('Estado del servicio actualizado.');
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : 'No fue posible actualizar el servicio');
                    }
                  }}
                />
              )}

              {currentView === 'provider-availability' && (
                <ProviderAvailability
                  slots={slots}
                  onOpenNewSlot={() => setIsNewSlotOpen(true)}
                  onDeleteSlot={handleDeleteSlot}
                />
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
