import React, { useMemo, useState } from 'react';
import { CalendarEvent, Booking } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ban,
  User,
  MapPin,
  Check,
  X,
  Sparkles
} from 'lucide-react';

interface ProviderAgendaProps {
  events: CalendarEvent[];
  bookings: Booking[];
  onConfirmBooking: (id: string) => void;
  onCancelBooking: (booking: Booking) => void;
  onOpenNewSlot: () => void;
}

export const ProviderAgenda: React.FC<ProviderAgendaProps> = ({
  events,
  bookings,
  onConfirmBooking,
  onCancelBooking,
  onOpenNewSlot,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(events[0] || null);
  const [currentWeekLabel] = useState('Próximos horarios');

  const days = useMemo(
    () => Array.from(new Set(events.map((event) => event.day))).slice(0, 4),
    [events]
  );
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  const formatHourLabel = (h: number) => {
    if (h === 12) return '12:00 PM';
    if (h > 12) return `0${h - 12}:00 PM`;
    return `0${h}:00 AM`;
  };

  return (
    <div className="space-y-6">
      {/* Header (Image 24 bottom) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">
            Mi Agenda de Servicios
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cronograma semanal interactivo con sincronización bidireccional en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-3">{currentWeekLabel}</span>
            <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenNewSlot}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publicar horario</span>
          </button>
        </div>
      </div>

      {/* Legend chips */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-600">
        <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider mr-1">
          Convenciones:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Cita Confirmada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Pendiente de Aprobación</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>Cupo Libre Publicado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
          <span>Horario Bloqueado</span>
        </div>
      </div>

      {/* Calendar Grid + Quick Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Timeline Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs overflow-x-auto">
          {/* Day Headers */}
          <div className="grid grid-cols-5 border-b border-slate-200 pb-3 mb-2 min-w-[540px]">
            <div className="text-[11px] font-bold text-slate-400 uppercase text-center">Hora</div>
            {days.map((day) => {
              const isToday = day.includes('Hoy');
              return (
                <div key={day} className="text-center">
                  <span
                    className={`inline-block text-xs font-extrabold px-3 py-1 rounded-xl ${
                      isToday
                        ? 'bg-blue-700 text-white shadow-xs'
                        : 'text-slate-700 bg-slate-100'
                    }`}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Timeline Rows */}
          <div className="relative min-w-[540px]">
            {/* Red / Blue current time marker line */}
            <div
              style={{ top: '220px' }}
              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1"></span>
              <div className="w-full h-0.5 bg-red-400/80"></div>
              <span className="text-[9px] font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded shadow-xs ml-1">
                10:45 AM
              </span>
            </div>

            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-5 border-b border-slate-100 h-16 relative">
                {/* Hour label */}
                <div className="text-[10px] font-bold text-slate-400 text-center pt-1 select-none">
                  {formatHourLabel(hour)}
                </div>

                {/* Day cell slots */}
                {days.map((day) => {
                  // Find if any event starts in this hour for this day
                  const matchingEvents = events.filter(
                    (ev) => ev.day === day && Math.floor(ev.startHour) === hour
                  );

                  return (
                    <div
                      key={day}
                      className="border-l border-slate-100 relative p-1 hover:bg-blue-50/20 transition-colors"
                    >
                      {matchingEvents.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left p-1.5 rounded-xl border text-[10px] transition-all shadow-2xs ${
                            ev.color
                          } ${
                            selectedEvent?.id === ev.id
                              ? 'ring-2 ring-blue-600 scale-[1.02] shadow-sm'
                              : 'hover:opacity-90'
                          }`}
                        >
                          <div className="font-bold truncate">{ev.title}</div>
                          <div className="truncate text-[9px] opacity-80">{ev.client}</div>
                          <div className="text-[9px] font-semibold mt-0.5">{ev.timeRange}</div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Detail Drawer (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs sticky top-24 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-[#0b1c30] font-display">
                Detalle Rápido de Cita
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {selectedEvent?.day || 'Selección'}
              </span>
            </div>

            {selectedEvent ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    EVENTO / SERVICIO
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 font-display mt-0.5">
                    {selectedEvent.title}
                  </h4>
                  <p className="text-slate-500 font-medium mt-0.5">{selectedEvent.client}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Horario:</span>
                    <span className="font-bold text-slate-800">{selectedEvent.timeRange}</span>
                  </div>
                  {selectedEvent.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tarifa acordada:</span>
                      <span className="font-bold text-blue-700">{selectedEvent.price}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Estado:</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        selectedEvent.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedEvent.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : selectedEvent.status === 'available'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedEvent.status === 'confirmed'
                        ? 'Confirmada'
                        : selectedEvent.status === 'pending'
                        ? 'Por Confirmar'
                        : selectedEvent.status === 'available'
                        ? 'Cupo Libre'
                        : 'Bloqueado'}
                    </span>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 italic bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/60">
                  Recordatorio automático configurado para enviar por WhatsApp al cliente 2 horas antes de la cita.
                </p>

                {/* Actions */}
                <div className="pt-2 space-y-2">
                  {selectedEvent.status === 'pending' && (
                    <button
                      onClick={() => {
                        alert('¡Cita confirmada con éxito! Se notificó al cliente.');
                        selectedEvent.status = 'confirmed';
                        selectedEvent.color = 'bg-emerald-100 border-emerald-500 text-emerald-900';
                        setSelectedEvent({ ...selectedEvent });
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar cita ahora</span>
                    </button>
                  )}

                  <button
                    onClick={() => alert(`Reprogramando cita para ${selectedEvent.client}`)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    Reprogramar franja
                  </button>

                  <button
                    onClick={() => {
                      alert(`Cita cancelada`);
                      selectedEvent.status = 'blocked';
                      selectedEvent.color = 'bg-slate-100 border-slate-300 text-slate-600';
                      setSelectedEvent({ ...selectedEvent });
                    }}
                    className="w-full py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
                  >
                    Cancelar cita
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Haz clic en cualquier bloque de la agenda para ver los detalles.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
