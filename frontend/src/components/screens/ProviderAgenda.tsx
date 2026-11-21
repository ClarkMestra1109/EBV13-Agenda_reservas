import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  RefreshCw,
  Trash2,
  UserRound,
} from 'lucide-react';
import { CalendarEvent, CurrentView, ServiceItem } from '../../types';
import { formatDuration } from '../../utils/formatDuration';

type CalendarMode = 'day' | 'week' | 'month';

interface ProviderAgendaProps {
  events: CalendarEvent[];
  services: ServiceItem[];
  onOpenNewSlot: () => void;
  onDeleteSlot: (id: string) => void;
  onRefresh: () => Promise<void>;
  onNavigate: (view: CurrentView) => void;
}

const DAY_HEIGHT = 64;
const FIRST_HOUR = 7;
const LAST_HOUR = 20;
const HOUR_COUNT = LAST_HOUR - FIRST_HOUR;
const TIME_ZONE = 'America/Bogota';
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const getBogotaParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value || 0);
  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
    hour: part('hour'),
    minute: part('minute'),
  };
};
const todayInBogota = () => {
  const { year, month, day } = getBogotaParts(new Date());
  return new Date(year, month - 1, day);
};
const addDays = (date: Date, count: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
};
const weekStart = (date: Date) => {
  const start = startOfDay(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
};
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const sameDay = (first: Date, second: Date) => dateKey(first) === dateKey(second);
const dayLabel = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(date).replace('.', '');
const fullDate = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TIME_ZONE,
  }).format(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 17)));
const shortTime = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: TIME_ZONE,
  }).format(date);
const shortDate = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(date).replace('.', '');
const eventDay = (event: CalendarEvent) => {
  const { year, month, day } = getBogotaParts(new Date(event.startAt));
  return new Date(year, month - 1, day);
};
const gridHourLabel = (hour: number) =>
  new Intl.DateTimeFormat('es-CO', { hour: '2-digit', hour12: true, timeZone: 'UTC' })
    .format(new Date(Date.UTC(2020, 0, 1, hour)));
const icsEscape = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsDate = (value: string) =>
  new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const getCalendarDays = (mode: CalendarMode, selectedDate: Date) => {
  if (mode === 'day') return [startOfDay(selectedDate)];
  if (mode === 'week') {
    const first = weekStart(selectedDate);
    return Array.from({ length: 7 }, (_, index) => addDays(first, index));
  }

  const firstOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const first = weekStart(firstOfMonth);
  const lastOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  const last = addDays(weekStart(lastOfMonth), 6);
  const dayCount = Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1;
  return Array.from({ length: dayCount }, (_, index) => addDays(first, index));
};

const getRangeLabel = (mode: CalendarMode, days: Date[]) => {
  if (mode === 'day') return fullDate(days[0]);
  if (mode === 'month') {
    return `${MONTH_NAMES[days.find((date) => date.getDate() === 1)?.getMonth() ?? days[Math.floor(days.length / 2)].getMonth()]} ${days.find((date) => date.getDate() === 1)?.getFullYear() ?? days[0].getFullYear()}`;
  }
  const first = days[0];
  const last = days[days.length - 1];
  if (first.getMonth() === last.getMonth()) {
    return `Semana del ${first.getDate()} al ${last.getDate()} de ${MONTH_NAMES[last.getMonth()]} de ${last.getFullYear()}`;
  }
  return `Semana del ${shortDate(first)} al ${shortDate(last)} de ${last.getFullYear()}`;
};

export const ProviderAgenda: React.FC<ProviderAgendaProps> = ({
  events,
  services,
  onOpenNewSlot,
  onDeleteSlot,
  onRefresh,
  onNavigate,
}) => {
  const [selectedDate, setSelectedDate] = useState(todayInBogota);
  const [mode, setMode] = useState<CalendarMode>('week');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const days = useMemo(() => getCalendarDays(mode, selectedDate), [mode, selectedDate]);
  const dayKeys = useMemo(() => new Set(days.map(dateKey)), [days]);
  const visibleEvents = useMemo(
    () =>
      events.filter((event) => {
        if (!event.startAt || !event.endAt) return false;
        if (!dayKeys.has(dateKey(eventDay(event)))) return false;
        return serviceFilter === 'all' || event.serviceId === serviceFilter;
      }),
    [dayKeys, events, serviceFilter]
  );
  const selectedEvent = visibleEvents.find((event) => event.id === selectedEventId) || null;
  const rangeLabel = getRangeLabel(mode, days);

  useEffect(() => {
    if (!selectedEventId || !visibleEvents.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(visibleEvents[0]?.id || null);
    }
  }, [selectedEventId, visibleEvents]);

  const moveCalendar = (direction: number) => {
    if (mode === 'day') {
      setSelectedDate((current) => addDays(current, direction));
    } else if (mode === 'week') {
      setSelectedDate((current) => addDays(current, direction * 7));
    } else {
      setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    const calendarLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AgendaPro//Mi Agenda//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...visibleEvents.flatMap((event) => [
        'BEGIN:VEVENT',
        `UID:${icsEscape(event.id)}@agendapro`,
        `DTSTAMP:${icsDate(new Date().toISOString())}`,
        `DTSTART:${icsDate(event.startAt)}`,
        `DTEND:${icsDate(event.endAt)}`,
        `SUMMARY:${icsEscape(event.status === 'available' ? `Disponible: ${event.title}` : event.title)}`,
        `DESCRIPTION:${icsEscape(`${event.client}${event.price ? ` · ${event.price}` : ''}`)}`,
        `LOCATION:${icsEscape(event.location || '')}`,
        'END:VEVENT',
      ]),
      'END:VCALENDAR',
    ];
    const blob = new Blob([calendarLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenda-${dateKey(days[0])}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleRemoveSlot = () => {
    if (!selectedEvent?.slotId) return;
    if (window.confirm(`¿Retirar el horario de ${selectedEvent.title}? Dejará de estar disponible para reservas.`)) {
      onDeleteSlot(selectedEvent.slotId);
      setSelectedEventId(null);
    }
  };

  const changeMode = (nextMode: CalendarMode) => {
    setMode(nextMode);
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-700">Planificación semanal · Workspace</p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#0b1c30]">Mi Agenda de Servicios</h1>
            <p className="mt-0.5 text-[11px] text-slate-500">Gestiona las citas y horarios de tus servicios publicados.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-600">
            <Clock3 className="h-3.5 w-3.5 text-blue-600" />
            GMT−5 · Bogotá / Lima
          </span>
          <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-600">
            <span className="sr-only">Filtrar por servicio</span>
            <select
              aria-label="Filtrar por servicio"
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              className="max-w-40 bg-transparent outline-none"
            >
              <option value="all">Todos los servicios</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.title}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Actualizar datos de agenda"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-800 transition hover:bg-blue-100"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Exportar agenda (.ics)
          </button>
          <button
            type="button"
            onClick={onOpenNewSlot}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:bg-blue-800"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Publicar horario
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            <button type="button" onClick={() => moveCalendar(-1)} aria-label="Periodo anterior" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setSelectedDate(todayInBogota())} className="px-2.5 text-[10px] font-bold text-blue-800 hover:text-blue-900">
              Hoy
            </button>
            <button type="button" onClick={() => moveCalendar(1)} aria-label="Periodo siguiente" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs font-bold text-slate-800">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg bg-slate-100 p-0.5 sm:self-auto">
          {([
            ['day', 'Día'],
            ['week', 'Semana'],
            ['month', 'Mes'],
          ] as [CalendarMode, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeMode(value)}
              aria-pressed={mode === value}
              className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition ${
                mode === value ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200/80 bg-white p-3 text-[10px] font-semibold text-slate-600 sm:grid-cols-4">
        <Legend color="bg-emerald-500" label="Cita confirmada" />
        <Legend color="bg-blue-500" label="Horario disponible" />
        <span className="text-slate-400 sm:col-span-2">Las citas se confirman automáticamente. Puedes retirar horarios aún disponibles.</span>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
          {mode === 'month' ? (
            <MonthCalendar
              days={days}
              selectedDate={selectedDate}
              events={visibleEvents}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setMode('day');
              }}
              onSelectEvent={setSelectedEventId}
              selectedEventId={selectedEventId}
            />
          ) : (
            <TimelineCalendar
              days={days}
              events={visibleEvents}
              selectedDate={selectedDate}
              selectedEventId={selectedEventId}
              onSelectDate={setSelectedDate}
              onSelectEvent={setSelectedEventId}
            />
          )}
          <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-200 bg-blue-50/70 px-3 py-2 text-[9px] font-semibold text-slate-500">
            <Legend color="bg-emerald-500" label="Cita" />
            <Legend color="bg-blue-500" label="Disponible" />
            <span>Selecciona un bloque para ver sus detalles y acciones.</span>
          </footer>
        </section>

        <aside className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs lg:sticky lg:top-20">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-extrabold text-[#0b1c30]">Detalle rápido</h2>
            {selectedEvent && (
              <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                selectedEvent.status === 'available'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}>
                {selectedEvent.status === 'available' ? 'Disponible' : 'Confirmada'}
              </span>
            )}
          </div>

          {selectedEvent ? (
            <EventDetails
              event={selectedEvent}
              onRemoveSlot={handleRemoveSlot}
              onOpenReservations={() => onNavigate('provider-reservations')}
            />
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <CalendarDays className="h-7 w-7 text-slate-300" />
              <p className="mt-2 text-xs font-bold text-slate-600">No hay eventos en este periodo</p>
              <p className="mt-1 max-w-48 text-[10px] leading-relaxed text-slate-400">
                Prueba otro rango o publica un horario para recibir reservas.
              </p>
              <button type="button" onClick={onOpenNewSlot} className="mt-3 rounded-lg bg-blue-700 px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-800">
                Publicar horario
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <i className={`h-2 w-2 rounded-full ${color}`} />
    {label}
  </span>
);

const TimelineCalendar: React.FC<{
  days: Date[];
  events: CalendarEvent[];
  selectedDate: Date;
  selectedEventId: string | null;
  onSelectDate: (date: Date) => void;
  onSelectEvent: (id: string) => void;
}> = ({ days, events, selectedDate, selectedEventId, onSelectDate, onSelectEvent }) => {
  const minWidth = 56 + days.length * (days.length === 1 ? 180 : 108);
  const today = todayInBogota();
  const { hour: currentHour, minute: currentMinute } = getBogotaParts(new Date());
  const nowOffset = (currentHour + currentMinute / 60 - FIRST_HOUR) * DAY_HEIGHT;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth }} className="relative">
        <div
          className="sticky top-0 z-20 grid border-b border-slate-200 bg-white"
          style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div className="px-1 py-3 text-center text-[8px] font-bold uppercase text-slate-400">Hora</div>
          {days.map((date) => (
            <button
              key={dateKey(date)}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`border-l border-slate-100 px-1 py-2 text-center transition ${
                sameDay(date, today) ? 'bg-blue-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <span className={`block text-[8px] font-bold uppercase ${sameDay(date, today) ? 'text-blue-700' : 'text-slate-500'}`}>
                {dayLabel(date)}
              </span>
              <span className={`mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${
                sameDay(date, today) ? 'bg-blue-700 text-white' : 'text-slate-800'
              }`}>
                {date.getDate()}
              </span>
              <span className="mt-0.5 block text-[8px] text-slate-400">
                {events.filter((event) => sameDay(eventDay(event), date)).length} eventos
              </span>
            </button>
          ))}
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
        >
          <div className="relative" style={{ height: HOUR_COUNT * DAY_HEIGHT }}>
            {Array.from({ length: HOUR_COUNT }, (_, index) => FIRST_HOUR + index).map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 -translate-y-1/2 pr-1 text-right text-[8px] font-semibold text-slate-400"
                style={{ top: (hour - FIRST_HOUR) * DAY_HEIGHT + 8 }}
              >
                {gridHourLabel(hour)}
              </div>
            ))}
          </div>

          {days.map((date) => {
            const dayEvents = events.filter((event) => sameDay(eventDay(event), date));
            const showNow = sameDay(date, today) && nowOffset >= 0 && nowOffset <= HOUR_COUNT * DAY_HEIGHT;
            return (
              <div key={dateKey(date)} className={`relative border-l border-slate-100 ${sameDay(date, selectedDate) ? 'bg-blue-50/20' : ''}`} style={{ height: HOUR_COUNT * DAY_HEIGHT }}>
                {Array.from({ length: HOUR_COUNT }, (_, index) => (
                  <div
                    key={index}
                    className="absolute left-0 right-0 border-t border-slate-100"
                    style={{ top: index * DAY_HEIGHT, height: DAY_HEIGHT }}
                  />
                ))}
                {showNow && (
                  <div className="pointer-events-none absolute left-0 right-0 z-10 flex items-center" style={{ top: nowOffset }}>
                    <span className="-ml-1 h-2 w-2 rounded-full bg-red-500" />
                    <span className="h-px flex-1 bg-red-400" />
                  </div>
                )}
                {dayEvents.map((event) => {
                  const start = new Date(event.startAt);
                  const end = new Date(event.endAt);
                  const startParts = getBogotaParts(start);
                  const endParts = getBogotaParts(end);
                  const startMinutes = startParts.hour * 60 + startParts.minute;
                  const endMinutes = endParts.hour * 60 + endParts.minute;
                  const top = Math.max(0, (startMinutes - FIRST_HOUR * 60) / 60 * DAY_HEIGHT);
                  const bottom = Math.min(HOUR_COUNT * DAY_HEIGHT, (endMinutes - FIRST_HOUR * 60) / 60 * DAY_HEIGHT);
                  if (bottom <= 0 || top >= HOUR_COUNT * DAY_HEIGHT) return null;
                  const height = Math.max(34, bottom - top);
                  const available = event.status === 'available';
                  const selected = event.id === selectedEventId;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelectEvent(event.id)}
                      title={`${event.title} · ${event.client} · ${event.timeRange}`}
                      className={`absolute left-1 right-1 z-[11] overflow-hidden rounded-md border-l-[3px] p-1 text-left shadow-sm transition hover:z-[12] hover:brightness-[0.98] ${
                        available
                          ? 'border-blue-500 bg-blue-50 text-blue-950'
                          : 'border-emerald-600 bg-emerald-50 text-emerald-950'
                      } ${selected ? 'ring-2 ring-blue-600 ring-offset-1' : ''}`}
                      style={{ top, height }}
                    >
                      <span className="block truncate text-[9px] font-extrabold">{event.title}</span>
                      <span className="block truncate text-[8px] opacity-80">{event.client}</span>
                      <span className="mt-0.5 block truncate text-[8px] font-bold">{shortTime(start)}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MonthCalendar: React.FC<{
  days: Date[];
  selectedDate: Date;
  events: CalendarEvent[];
  selectedEventId: string | null;
  onSelectDate: (date: Date) => void;
  onSelectEvent: (id: string) => void;
}> = ({ days, selectedDate, events, selectedEventId, onSelectDate, onSelectEvent }) => (
  <div className="overflow-x-auto">
    <div className="min-w-[700px]">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
          <div key={day} className="py-2 text-center text-[9px] font-bold uppercase text-slate-500">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date) => {
          const dateEvents = events.filter((event) => sameDay(eventDay(event), date));
          const inMonth = date.getMonth() === selectedDate.getMonth();
          return (
            <div key={dateKey(date)} className={`min-h-24 border-b border-r border-slate-100 p-1.5 ${inMonth ? '' : 'bg-slate-50/70'}`}>
              <button
                type="button"
                onClick={() => onSelectDate(date)}
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  sameDay(date, selectedDate) ? 'bg-blue-700 text-white' : inMonth ? 'text-slate-700 hover:bg-blue-50' : 'text-slate-300'
                }`}
              >
                {date.getDate()}
              </button>
              <div className="space-y-1">
                {dateEvents.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => {
                      onSelectDate(date);
                      onSelectEvent(event.id);
                    }}
                    className={`block w-full truncate rounded px-1 py-1 text-left text-[8px] font-semibold ${
                      event.status === 'available' ? 'bg-blue-50 text-blue-800' : 'bg-emerald-50 text-emerald-800'
                    } ${selectedEventId === event.id ? 'ring-1 ring-blue-600' : ''}`}
                    title={`${event.title} · ${event.timeRange}`}
                  >
                    {shortTime(new Date(event.startAt))} {event.title}
                  </button>
                ))}
                {dateEvents.length > 3 && <span className="block px-1 text-[8px] text-slate-400">+{dateEvents.length - 3} más</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const EventDetails: React.FC<{
  event: CalendarEvent;
  onRemoveSlot: () => void;
  onOpenReservations: () => void;
}> = ({ event, onRemoveSlot, onOpenReservations }) => {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  const isAvailable = event.status === 'available';

  return (
    <div className="space-y-3 text-[11px]">
      <div className={`flex items-center gap-2 rounded-xl p-3 ${isAvailable ? 'bg-blue-50' : 'bg-emerald-50'}`}>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isAvailable ? 'bg-white text-blue-700' : 'bg-white text-emerald-700'}`}>
          {isAvailable ? <CalendarPlus className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-extrabold text-slate-800">{event.client}</p>
          <p className="text-[9px] text-slate-500">{isAvailable ? 'Horario publicado' : 'Reserva confirmada'}</p>
        </div>
      </div>

      <div>
        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Servicio solicitado</p>
        <h3 className="mt-0.5 font-display text-sm font-extrabold text-slate-900">{event.title}</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DetailTile label="Fecha y hora" value={`${fullDate(start)} · ${shortTime(start)}–${shortTime(end)}`} />
        <DetailTile label="Duración" value={formatDuration(durationMinutes)} />
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-blue-50 p-3">
        <div>
          <p className="text-[9px] text-slate-500">{isAvailable ? 'Cupos' : 'Tarifa del servicio'}</p>
          <p className="mt-0.5 font-display text-sm font-extrabold text-blue-900">
            {isAvailable ? event.client : event.price || 'No disponible'}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-slate-500">Proveedor</p>
          <p className="mt-0.5 font-bold text-slate-800">{event.location || 'No registrada'}</p>
        </div>
      </div>

      {isAvailable ? (
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onRemoveSlot}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white py-2 text-[10px] font-bold text-rose-700 transition hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Retirar horario publicado
          </button>
          <p className="text-center text-[9px] leading-relaxed text-slate-400">
            Al retirarlo dejará de aparecer como disponible para reservas.
          </p>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[9px] font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Confirmada automáticamente por el sistema
          </div>
          <button
            type="button"
            onClick={onOpenReservations}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-700 py-2 text-[10px] font-bold text-white transition hover:bg-blue-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver gestión de reservas
          </button>
          <p className="text-center text-[9px] leading-relaxed text-slate-400">
            Para cancelar o reprogramar, el cliente debe gestionar su reserva desde su cuenta.
          </p>
        </div>
      )}
    </div>
  );
};

const DetailTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0 rounded-lg bg-slate-50 p-2.5">
    <p className="text-[8px] font-semibold text-slate-500">{label}</p>
    <p className="mt-0.5 break-words text-[9px] font-bold text-slate-800">{value}</p>
  </div>
);
