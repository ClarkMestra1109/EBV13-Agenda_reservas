import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserRole, CurrentView, Booking, BookingStatus } from '../types';
import {
  Calendar,
  Plus,
  Bell,
  Briefcase,
  Clock,
  ChevronDown,
  CalendarCheck2,
} from 'lucide-react';

interface HeaderProps {
  role: UserRole;
  userName: string;
  bookings: Booking[];
  bookingsReady: boolean;
  onNavigate: (view: CurrentView) => void;
  onOpenNewService: () => void;
  onOpenNewSlot: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  userName,
  bookings,
  bookingsReady,
  onNavigate,
  onOpenNewService,
  onOpenNewSlot,
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [cancellationNotices, setCancellationNotices] = useState<
    Array<{ booking: Booking; detectedAt: number; isRead: boolean }>
  >([]);
  const [activeCancellationNotice, setActiveCancellationNotice] = useState<Booking | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const previousBookingStatuses = useRef<Map<string, BookingStatus> | null>(null);
  const todayLabel = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            booking.status === 'confirmed' &&
            booking.backendInicio &&
            new Date(booking.backendInicio).getTime() >= Date.now()
        )
        .sort(
          (a, b) =>
            new Date(a.backendInicio!).getTime() - new Date(b.backendInicio!).getTime()
        ),
    [bookings]
  );
  const displayedBookings = upcomingBookings.slice(0, 5);

  useEffect(() => {
    if (role !== 'provider' || !bookingsReady) return;

    const currentStatuses = new Map(bookings.map((booking) => [booking.id, booking.status]));
    const previousStatuses = previousBookingStatuses.current;
    previousBookingStatuses.current = currentStatuses;

    if (!previousStatuses) return;

    const newlyCancelled = bookings.filter(
      (booking) =>
        booking.status === 'cancelled' &&
        previousStatuses.get(booking.id) !== 'cancelled'
    );
    if (newlyCancelled.length === 0) return;

    const detectedAt = Date.now();
    setCancellationNotices((current) => [
      ...newlyCancelled.map((booking) => ({ booking, detectedAt, isRead: false })),
      ...current.filter(
        (notice) => !newlyCancelled.some((booking) => booking.id === notice.booking.id)
      ),
    ]);
    setActiveCancellationNotice(newlyCancelled[newlyCancelled.length - 1]);
  }, [bookings, bookingsReady, role]);

  useEffect(() => {
    if (!activeCancellationNotice) return;
    const timeoutId = window.setTimeout(() => setActiveCancellationNotice(null), 8000);
    return () => window.clearTimeout(timeoutId);
  }, [activeCancellationNotice]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!actionMenuRef.current?.contains(target)) setShowActionMenu(false);
      if (!notificationsRef.current?.contains(target)) setShowNotifications(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowActionMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const openReservations = () => {
    setShowNotifications(false);
    setCancellationNotices((current) =>
      current.map((notice) => ({ ...notice, isRead: true }))
    );
    onNavigate(role === 'provider' ? 'provider-reservations' : 'client-reservations');
  };

  const unreadCancellationCount = cancellationNotices.filter((notice) => !notice.isRead).length;
  const notificationCount = role === 'provider' ? unreadCancellationCount : 0;

  return (
    <header
      id="app-header"
      className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-[#e5eaf2] bg-white/95 px-4 backdrop-blur-md sm:px-6"
    >
      {role === 'provider' && activeCancellationNotice && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed right-4 top-20 z-[60] flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-xl"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-slate-900">Reserva cancelada por el cliente</p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-700">
              {activeCancellationNotice.serviceTitle}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {activeCancellationNotice.clientName || 'Cliente'} ·{' '}
              {activeCancellationNotice.timeSlotFormatted}
            </p>
            <button
              type="button"
              onClick={openReservations}
              className="mt-2 text-[11px] font-bold text-blue-700 hover:underline"
            >
              Ver reservas
            </button>
          </div>
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-1.5 text-xs font-semibold capitalize text-slate-600 lg:flex">
          <Calendar className="h-3.5 w-3.5 text-blue-600" />
          <span>{todayLabel}</span>
        </div>

        {role === 'provider' && (
          <div className="relative" ref={actionMenuRef}>
            <button
              id="header-action-button"
              type="button"
              aria-haspopup="menu"
              aria-expanded={showActionMenu}
              onClick={() => {
                setShowNotifications(false);
                setShowActionMenu((open) => !open);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-800"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Acción</span>
              <ChevronDown className="ml-0.5 h-3 w-3 opacity-80" />
            </button>

            {showActionMenu && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-56 animate-in fade-in slide-in-from-top-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowActionMenu(false);
                    onOpenNewService();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700"
                >
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <span>Nuevo servicio</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowActionMenu(false);
                    onOpenNewSlot();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-700"
                >
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Publicar horario libre</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowActionMenu(false);
                    onNavigate('provider-agenda');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-amber-700"
                >
                  <Calendar className="h-4 w-4 text-amber-500" />
                  <span>Gestionar horarios en agenda</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            aria-label={`Notificaciones: ${notificationCount}`}
            aria-haspopup="dialog"
            aria-expanded={showNotifications}
            onClick={() => {
              setShowActionMenu(false);
              const opening = !showNotifications;
              setShowNotifications(opening);
              if (opening && role === 'provider') {
                setCancellationNotices((current) =>
                  current.map((notice) => ({ ...notice, isRead: true }))
                );
                setActiveCancellationNotice(null);
              }
            }}
            className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            title="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-700 px-1 text-[9px] font-bold leading-none text-white">
                {notificationCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              role="dialog"
              aria-label="Notificaciones"
              className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Notificaciones</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {role === 'provider' && cancellationNotices.length > 0
                      ? unreadCancellationCount > 0
                        ? `${unreadCancellationCount} cancelación${unreadCancellationCount === 1 ? '' : 'es'} sin leer`
                        : 'Cancelaciones leídas'
                      : upcomingBookings.length
                      ? `${upcomingBookings.length} reserva${upcomingBookings.length === 1 ? '' : 's'} próxima${upcomingBookings.length === 1 ? '' : 's'}`
                      : 'Sin novedades'}
                  </p>
                </div>
                <CalendarCheck2 className="h-4 w-4 text-blue-600" />
              </div>

              {role === 'provider' && cancellationNotices.length > 0 && (
                <div className="max-h-64 overflow-y-auto border-b border-slate-100 p-2">
                  {cancellationNotices.map(({ booking, detectedAt, isRead }) => (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={openReservations}
                      className={`w-full rounded-xl border-l-2 p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                        isRead
                          ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                          : 'border-amber-400 bg-amber-50/70 hover:bg-amber-50'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="block truncate text-xs font-bold text-slate-800">
                        El cliente canceló: {booking.serviceTitle}
                        </span>
                        <span className={`shrink-0 text-[9px] font-bold uppercase ${isRead ? 'text-slate-400' : 'text-amber-700'}`}>
                          {isRead ? 'Leída' : 'Nueva'}
                        </span>
                      </span>
                      <span className="mt-1 block text-[11px] text-slate-600">
                        {booking.clientName || 'Cliente'} · {booking.timeSlotFormatted}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400">
                        Aviso recibido{' '}
                        {new Intl.DateTimeFormat('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(detectedAt)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {upcomingBookings.length ? (
                <div className="max-h-64 overflow-y-auto p-2">
                  <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Reservas próximas
                  </p>
                  {displayedBookings.map((booking) => {
                    const startAt = new Date(booking.backendInicio!);
                    const dateLabel = new Intl.DateTimeFormat('es-CO', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    }).format(startAt);

                    return (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={openReservations}
                        className="w-full rounded-xl p-3 text-left transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                      >
                        <span className="block truncate text-xs font-bold text-slate-800">
                          {booking.serviceTitle}
                        </span>
                        <span className="mt-1 block text-[11px] capitalize text-slate-500">
                          {dateLabel}
                          {role === 'provider' && booking.clientName
                            ? ` · ${booking.clientName}`
                            : ''}
                        </span>
                      </button>
                    );
                  })}
                  {upcomingBookings.length > displayedBookings.length && (
                    <p className="px-3 py-2 text-center text-[10px] text-slate-500">
                      Hay {upcomingBookings.length - displayedBookings.length} citas más.
                    </p>
                  )}
                </div>
              ) : !(role === 'provider' && cancellationNotices.length > 0) ? (
                <div className="px-4 py-7 text-center">
                  <Bell className="mx-auto h-5 w-5 text-slate-300" />
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    No tienes reservas próximas
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Aquí aparecerán las reservas registradas en tu cuenta.
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                onClick={openReservations}
                className="w-full border-t border-slate-100 px-4 py-3 text-center text-xs font-bold text-blue-700 transition-colors hover:bg-slate-50"
              >
                Ver todas las reservas
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:gap-2.5 sm:pl-3">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-[11px] font-extrabold text-white ring-2 ring-blue-100">
              {userName ? userName.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="hidden text-left leading-tight md:block">
            <p className="max-w-32 truncate text-xs font-bold text-slate-800">{userName}</p>
            <p className="text-[10px] font-semibold text-blue-700">
              {role === 'provider' ? 'Proveedor' : 'Cliente'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
