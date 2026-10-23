import React, { useState } from 'react';
import { Booking, ServiceItem, AvailabilitySlot, CurrentView } from '../../types';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Share2,
  CalendarDays,
  Sparkles,
  MapPin,
  Trash2,
  X
} from 'lucide-react';

interface ProviderDashboardProps {
  userName: string;
  bookings: Booking[];
  services: ServiceItem[];
  slots: AvailabilitySlot[];
  onNavigate: (view: CurrentView) => void;
  onOpenNewService: () => void;
  onOpenNewSlot: () => void;
  onConfirmBooking: (id: string) => void;
  onCancelBooking: (booking: Booking) => void;
  onOpenShareModal: () => void;
  onDeleteSlot: (id: string) => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  userName,
  bookings,
  services,
  slots,
  onNavigate,
  onOpenNewService,
  onOpenNewSlot,
  onConfirmBooking,
  onCancelBooking,
  onOpenShareModal,
  onDeleteSlot,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');

  const filteredBookings =
    activeTab === 'all'
      ? bookings.slice(0, 5)
      : activeTab === 'pending'
      ? pendingBookings
      : confirmedBookings;


  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner (Image 4 & 10) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-blue-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>PANEL OPERATIVO PRINCIPAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
              Buenos días, {userName}
            </h1>
            <p className="text-blue-200/80 text-xs sm:text-sm leading-relaxed">
              Gestiona tus servicios, disponibilidades y próximas citas de tu negocio hoy.
              Tienes <strong className="text-white font-bold">{pendingBookings.length} reservas pendientes</strong> que requieren tu confirmación.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="dash-new-service-btn"
              onClick={onOpenNewService}
              className="bg-white hover:bg-blue-50 text-blue-900 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-blue-700" />
              <span>Nuevo servicio</span>
            </button>
            <button
              id="dash-new-slot-btn"
              onClick={onOpenNewSlot}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 border border-blue-400/30"
            >
              <Clock className="w-4 h-4" />
              <span>Publicar horario</span>
            </button>
            <button
              id="dash-view-agenda-btn"
              onClick={() => onNavigate('provider-agenda')}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all border border-slate-700"
            >
              Ver mi agenda
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards (Image 4 & 10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Servicios Activos
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0b1c30] font-display">{services.length}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              +2 este mes
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Disponibles en catálogo público</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Reservas Pendientes
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 font-display">
              {pendingBookings.length}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Por confirmar
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Requieren tu aprobación rápida</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Horarios Disponibles
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0b1c30] font-display">18</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              Cupos libres
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Semana actual (Lunes a Sábado)</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Reservas Confirmadas
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0b1c30] font-display">24</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              92% asistencia
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Con recordatorios automatizados</p>
        </div>
      </div>

      {/* Main Grid: Left Bookings Table, Right Slots & Public Link */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Próximas Reservas (7 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-[#0b1c30] font-display">
                Próximas Reservas de Hoy y Mañana
              </h2>
              <p className="text-xs text-slate-500">
                Revisa y confirma las solicitudes enviadas por tus clientes
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('all')}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todas ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'pending'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pendientes ({pendingBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('confirmed')}
                className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'confirmed'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Confirmadas ({confirmedBookings.length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Servicio</th>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {b.clientAvatar ? (
                          <img
                            src={b.clientAvatar}
                            alt={b.clientName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {b.clientInitials}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{b.clientName}</div>
                          <div className="text-[11px] text-slate-400">{b.clientPhone}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{b.serviceTitle}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {b.locationName}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{b.timeSlotFormatted}</div>
                      <div className="text-[11px] text-slate-400">{b.durationMinutes} minutos</div>
                    </td>

                    <td className="py-3 px-3">
                      {b.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Pendiente
                        </span>
                      ) : b.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Confirmada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          Cancelada
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => onConfirmBooking(b.id)}
                            title="Confirmar reserva"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        )}
                        {b.status !== 'cancelled' && (
                          <button
                            onClick={() => onCancelBooking(b)}
                            title="Cancelar reserva"
                            className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Mostrando {filteredBookings.length} de {bookings.length} reservas registradas
            </span>
            <button
              onClick={() => onNavigate('provider-reservations')}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Ver todas las reservas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Col: Disponibilidad & Enlace Público (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Horarios Disponibles Próximos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                <h3 className="text-sm font-extrabold text-[#0b1c30] font-display">
                  Horarios Disponibles Próximos
                </h3>
              </div>
              <button
                onClick={onOpenNewSlot}
                className="text-blue-700 hover:text-blue-800 text-xs font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-2.5 rounded-xl border border-slate-100 bg-[#f8faff] flex items-center justify-between hover:border-blue-200 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      {slot.dayLabel}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{slot.timeRange}</div>
                      <div className="text-[10px] text-slate-500">
                        {slot.capacityText} • {slot.serviceTag}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteSlot(slot.id)}
                    title="Eliminar cupo"
                    className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('provider-availability')}
              className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors text-center block"
            >
              Gestionar disponibilidad
            </button>
          </div>


        </div>
      </div>
    </div>
  );
};
