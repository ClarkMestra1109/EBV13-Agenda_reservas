import React, { useMemo } from 'react';
import { Booking, ServiceItem, CurrentView } from '../../types';
import {
  Compass,
  Calendar,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Ban,
} from 'lucide-react';

interface ClientDashboardProps {
  userName: string;
  bookings: Booking[];
  services: ServiceItem[];
  onNavigate: (view: CurrentView) => void;
  onSelectServiceToBook: (service: ServiceItem) => void;
  onCancelBooking: (booking: Booking) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  userName,
  bookings,
  services,
  onNavigate,
  onSelectServiceToBook,
  onCancelBooking,
}) => {
  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending'),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'completed'),
    [bookings]
  );

  const distinctProviders = useMemo(() => {
    const names = new Set(
      bookings
        .filter((b) => b.status !== 'cancelled' && b.locationName)
        .map((b) => b.locationName)
    );
    return Array.from(names);
  }, [bookings]);

  const nextBooking = useMemo(() => {
    const sorted = [...activeBookings].sort((a, b) => {
      const aTime = a.backendInicio ? new Date(a.backendInicio).getTime() : 0;
      const bTime = b.backendInicio ? new Date(b.backendInicio).getTime() : 0;
      return aTime - bTime;
    });
    return sorted[0] || null;
  }, [activeBookings]);

  const recentActivity = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => {
          const aTime = a.backendInicio ? new Date(a.backendInicio).getTime() : 0;
          const bTime = b.backendInicio ? new Date(b.backendInicio).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 3),
    [bookings]
  );

  const recommendedServices = services.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-blue-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>PANEL PERSONAL · SESIÓN INICIADA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
              Hola, {userName}
            </h1>
            <p className="text-blue-200/80 text-xs sm:text-sm leading-relaxed">
              Consulta los servicios publicados, revisa tus reservas y solicita una cita en los
              horarios disponibles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="client-explore-btn"
              onClick={() => onNavigate('client-explore')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 border border-blue-400/30"
            >
              <Compass className="w-4 h-4" />
              <span>Explorar servicios</span>
            </button>
            <button
              id="client-my-reservations-btn"
              onClick={() => onNavigate('client-reservations')}
              className="bg-white hover:bg-blue-50 text-blue-900 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <BookmarkCheck className="w-4 h-4 text-blue-700" />
              <span>Ver mis reservas</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards (datos reales) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Reservas Activas
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0b1c30] font-display">
              {activeBookings.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Pendientes o confirmadas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {nextBooking ? `Próxima cita: ${nextBooking.date}` : 'Sin citas próximas'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Servicios Completados
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0b1c30] font-display">
              {completedBookings.length}
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              En tu historial
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Se marcan al finalizar la cita
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Servicios Publicados
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0b1c30] font-display">
              {services.length}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Disponibles para explorar
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {distinctProviders.length > 0
              ? distinctProviders.slice(0, 3).join(', ')
              : 'Explora el catálogo para ver proveedores'}
          </p>
        </div>
      </div>

      {/* Main Row: Próxima Reserva + Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  nextBooking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              ></div>
              <h2 className="text-base font-extrabold text-[#0b1c30] font-display">
                Tu próxima reserva
              </h2>
            </div>
            {nextBooking && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Confirmada
              </span>
            )}
          </div>

          {nextBooking ? (
            <div className="mt-5 space-y-3">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  {nextBooking.locationName}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 font-display">
                  {nextBooking.serviceTitle}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">FECHA Y HORA</span>
                    <span className="font-bold text-slate-800">
                      {nextBooking.date}, {nextBooking.time}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">DURACIÓN</span>
                    <span className="font-bold text-slate-800">
                      {nextBooking.durationMinutes} minutos
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">VALOR ACORDADO</span>
                  <span className="text-base font-extrabold text-blue-700 font-display">
                    ${nextBooking.price.toLocaleString('es-CO')} COP
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCancelBooking(nextBooking)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
                  >
                    Cancelar reserva
                  </button>
                  <button
                    onClick={() => onNavigate('client-reservations')}
                    className="px-3.5 py-1.5 text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-colors"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 py-8 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Todavía no tienes reservas</p>
              <p className="text-xs text-slate-500">
                Cuando solicites una cita, su estado aparecerá aquí.
              </p>
              <button
                onClick={() => onNavigate('client-explore')}
                className="text-xs font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-xl inline-block"
              >
                Buscar un servicio
              </button>
            </div>
          )}
        </div>

        {/* Right: Actividad Reciente (derivada de reservas reales) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-[#0b1c30] font-display">
                Actividad Reciente
              </h3>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                En vivo
              </span>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              {recentActivity.length === 0 && (
                <p className="text-slate-400 text-center py-4">
                  Aún no tienes actividad registrada.
                </p>
              )}

              {recentActivity.map((booking) => (
                <div key={booking.id} className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {booking.status === 'cancelled' ? (
                      <Ban className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">
                      {booking.status === 'cancelled' ? 'Reserva cancelada' : 'Cita confirmada'}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {booking.serviceTitle} · {booking.date}, {booking.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('client-reservations')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors text-center block"
            >
              Ver historial completo
            </button>
          </div>
        </div>
      </div>

      {/* Servicios Recomendados (catálogo real) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-[#0b1c30] font-display">
              Servicios Disponibles
            </h3>
            <p className="text-xs text-slate-500">
              Publicados por los proveedores en la plataforma
            </p>
          </div>

          <button
            onClick={() => onNavigate('client-explore')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ver todo el catálogo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recommendedServices.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">
            Todavía no hay servicios publicados en el catálogo.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            {recommendedServices.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-slate-200/80 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group bg-[#fbfcfe]"
              >
                <div>
                  <div className="h-40 relative overflow-hidden">
                    <img
                      src={service.imageUrl}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                      {service.modalityBadge}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-extrabold px-2 py-0.5 rounded-lg shadow-2xs">
                      ${service.price.toLocaleString('es-CO')} COP
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-700 text-[11px]">
                        {service.providerName || service.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 font-display line-clamp-1">
                      {service.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    onClick={() => {
                      onSelectServiceToBook(service);
                      onNavigate('client-booking');
                    }}
                    className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Ver disponibilidad</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
