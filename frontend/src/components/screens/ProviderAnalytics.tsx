import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Clock3,
  Download,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { ServiceItem } from '../../types';
import { ApiInforme, getInforme } from '../../services/api';
import { hoyBogota, sumarAFecha } from '../../utils/validation';

type Period = 'month' | '7' | '30' | 'next30' | 'year' | 'custom';

interface ProviderAnalyticsProps {
  services: ServiceItem[];
  onNotify?: (message: string, type?: 'ok' | 'error') => void;
}

/** Una reserva del informe, en la forma que usan los gráficos. */
interface AnalyticsRow {
  id: number;
  backendInicio: string;
  backendFin: string;
  serviceId: string;
  serviceTitle: string;
  clientName: string;
  status: 'confirmed' | 'cancelled';
  price: number;
}

const DIAS_MAXIMOS = 366;

const diasEntre = (desde: string, hasta: string) =>
  Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);

const formatBogota = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', ...options }).format(new Date(iso));

interface TrendBucket {
  label: string;
  start: number;
  confirmed: number;
  cancelled: number;
}


const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' }).format(date);

const escapeCsv = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`;

const makeTrend = (bookings: AnalyticsRow[], start: Date | null, end: Date | null): TrendBucket[] => {
  const datedBookings = bookings
    .map((booking) => ({ booking, timestamp: Date.parse(booking.backendInicio || '') }))
    .filter((item) => Number.isFinite(item.timestamp));

  if (!datedBookings.length) return [];

  const first = start?.getTime() ?? Math.min(...datedBookings.map((item) => item.timestamp));
  const last = end ? end.getTime() + 86_399_999 : Math.max(...datedBookings.map((item) => item.timestamp));
  const spanDays = Math.max(1, Math.ceil((last - first) / 86_400_000));
  const bucketCount = Math.min(12, spanDays);
  const bucketSize = Math.max(86_400_000, (last - first + 1) / bucketCount);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = first + index * bucketSize;
    return {
      label: formatDate(new Date(bucketStart)),
      start: bucketStart,
      confirmed: 0,
      cancelled: 0,
    };
  });

  datedBookings.forEach(({ booking, timestamp }) => {
    const index = Math.min(bucketCount - 1, Math.floor((timestamp - first) / bucketSize));
    if (booking.status === 'cancelled') buckets[index].cancelled += 1;
    else buckets[index].confirmed += 1;
  });

  return buckets;
};

export const ProviderAnalytics: React.FC<ProviderAnalyticsProps> = ({ services, onNotify }) => {
  const hoy = hoyBogota();
  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState(() => sumarAFecha(hoy, { dias: -29 }));
  const [customEnd, setCustomEnd] = useState(hoy);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);
  const [report, setReport] = useState<ApiInforme | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Periodo en fechas YYYY-MM-DD (hora de Colombia). Ambas fechas se incluyen en el informe.
  const { desde, hasta } = useMemo(() => {
    switch (period) {
      case 'month': {
        const primero = `${hoy.slice(0, 8)}01`;
        return { desde: primero, hasta: sumarAFecha(primero, { meses: 1, dias: -1 }) };
      }
      case '7':
        return { desde: sumarAFecha(hoy, { dias: -6 }), hasta: hoy };
      case '30':
        return { desde: sumarAFecha(hoy, { dias: -29 }), hasta: hoy };
      case 'next30':
        return { desde: hoy, hasta: sumarAFecha(hoy, { dias: 29 }) };
      case 'year':
        return { desde: `${hoy.slice(0, 4)}-01-01`, hasta: `${hoy.slice(0, 4)}-12-31` };
      default:
        return { desde: customStart, hasta: customEnd };
    }
  }, [period, customStart, customEnd, hoy]);

  // HU22: un rango inválido no se consulta y se explica por qué.
  const rangeError = !desde || !hasta
    ? 'Selecciona la fecha inicial y la fecha final.'
    : desde > hasta
      ? 'El rango de fechas no es válido: la fecha inicial es posterior a la fecha final.'
      : diasEntre(desde, hasta) + 1 > DIAS_MAXIMOS
        ? 'El periodo consultado no puede superar un año.'
        : null;

  useEffect(() => {
    if (rangeError) {
      setReport(null);
      return;
    }
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    getInforme(desde, hasta, serviceFilter === 'all' ? undefined : Number(serviceFilter))
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((err) => {
        if (active) {
          setReport(null);
          setLoadError(err instanceof Error ? err.message : 'No fue posible generar el informe.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [desde, hasta, serviceFilter, rangeError, reloadKey]);

  const startDate = rangeError ? null : new Date(`${desde}T00:00:00`);
  const endDate = rangeError ? null : new Date(`${hasta}T00:00:00`);

  const filteredBookings: AnalyticsRow[] = useMemo(
    () =>
      (report?.reservas || []).map((row) => ({
        id: row.reservaId,
        backendInicio: row.inicio,
        backendFin: row.fin,
        serviceId: String(row.servicioId),
        serviceTitle: row.servicio,
        clientName: row.cliente,
        status: row.estado === 'CANCELADA' ? 'cancelled' : 'confirmed',
        price: Number(row.precio) || 0,
      })),
    [report]
  );

  const resumen = report?.resumen;
  const hasResults = Boolean(report && (report.reservas.length > 0 || report.resumen.cuposPublicados > 0));

  const confirmedCount = resumen?.reservas ?? 0;
  const cancelledCount = resumen?.canceladas ?? 0;
  const totalRows = confirmedCount + cancelledCount;
  const estimatedRevenue = Number(resumen?.ingresosEstimados ?? 0);
  const slotCapacity = resumen?.cuposPublicados ?? 0;
  const occupiedCapacity = resumen?.cuposReservados ?? 0;
  const freeCapacity = resumen?.cuposDisponibles ?? 0;
  const occupancy = resumen?.porcentajeOcupacion ?? null;
  const cancellationRate = totalRows > 0 ? (cancelledCount / totalRows) * 100 : 0;

  const serviceOptions = useMemo(
    () => {
      const byId = new Map<string, string>();
      services.forEach((service) => byId.set(service.id, service.title));
      (report?.porServicio || []).forEach((row) => {
        const id = String(row.servicioId);
        if (!byId.has(id)) byId.set(id, row.servicio);
      });
      return [...byId.entries()]
        .map(([id, title]) => ({ id, title }))
        .sort((a, b) => a.title.localeCompare(b.title, 'es'));
    },
    [report, services]
  );

  const serviceBreakdown = useMemo(() => {
    const byService = new Map<string, { title: string; total: number; confirmed: number; cancelled: number; revenue: number }>();
    filteredBookings.forEach((booking) => {
      const current = byService.get(booking.serviceId) || {
        title: booking.serviceTitle,
        total: 0,
        confirmed: 0,
        cancelled: 0,
        revenue: 0,
      };
      current.total += 1;
      if (booking.status === 'cancelled') current.cancelled += 1;
      else {
        current.confirmed += 1;
        current.revenue += booking.price;
      }
      byService.set(booking.serviceId, current);
    });

    return [...byService.entries()]
      .map(([serviceId, stats]) => ({ serviceId, ...stats }))
      .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, 'es'));
  }, [filteredBookings]);

  const trend = useMemo(
    () => makeTrend(filteredBookings, startDate, endDate),
    [endDate, filteredBookings, startDate]
  );
  const trendMaximum = Math.max(1, ...trend.map((item) => item.confirmed + item.cancelled));
  const chartPoints = (key: 'confirmed' | 'cancelled') =>
    trend
      .map((bucket, index) => {
        const x = trend.length === 1 ? 250 : 28 + (index * 444) / (trend.length - 1);
        const y = 138 - (bucket[key] / trendMaximum) * 112;
        return `${x},${y}`;
      })
      .join(' ');

  const demandByDay = Array.from({ length: 7 }, (_, day) => ({
    day,
    label: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][day],
    counts: [0, 0, 0],
  }));
  filteredBookings.forEach((booking) => {
    if (booking.status === 'cancelled' || !booking.backendInicio) return;
    const date = new Date(booking.backendInicio);
    const periodIndex = date.getHours() < 12 ? 0 : date.getHours() < 18 ? 1 : 2;
    demandByDay[date.getDay()].counts[periodIndex] += 1;
  });
  const maxDemand = Math.max(1, ...demandByDay.flatMap((day) => day.counts));

  const serviceColors = ['#155eef', '#344a9a', '#7aa7f8', '#10b981', '#f59e0b', '#8b5cf6'];
  const totalServiceBookings = serviceBreakdown.reduce((total, service) => total + service.total, 0);
  let donutOffset = 0;
  const donutGradient = serviceBreakdown.length
    ? `conic-gradient(${serviceBreakdown
        .map((service, index) => {
          const start = donutOffset;
          donutOffset += (service.total / totalServiceBookings) * 100;
          return `${serviceColors[index % serviceColors.length]} ${start}% ${donutOffset}%`;
        })
        .join(', ')})`
    : 'conic-gradient(#e2e8f0 0% 100%)';

  const periodLabel = rangeError
    ? 'Rango no válido'
    : `${formatBogota(`${desde}T12:00:00Z`, { dateStyle: 'medium' })} — ${formatBogota(`${hasta}T12:00:00Z`, { dateStyle: 'medium' })}`;
  const serviceLabel =
    serviceFilter === 'all'
      ? 'Todos los servicios'
      : serviceOptions.find((option) => option.id === serviceFilter)?.title || 'Servicio seleccionado';

  const handleRefresh = () => setReloadKey((key) => key + 1);

  // HU23: el archivo refleja exactamente lo que se ve con los filtros actuales; los filtros
  // de la pantalla no cambian al exportar.
  const handleExport = () => {
    if (rangeError) {
      onNotify?.(rangeError, 'error');
      return;
    }
    if (!report || !hasResults) {
      onNotify?.('No existen datos disponibles para exportar con los filtros seleccionados.', 'error');
      return;
    }
    const r = report.resumen;
    const rows: (string | number)[][] = [
      ['Reporte de reservas'],
      ['Periodo', `${report.desde} a ${report.hasta}`],
      ['Servicio', report.servicio || 'Todos los servicios'],
      ['Generado', formatBogota(new Date().toISOString(), { dateStyle: 'short', timeStyle: 'short' })],
      [],
      ['Resumen'],
      ['Reservas confirmadas', r.reservas],
      ['Reservas canceladas', r.canceladas],
      ['Cupos publicados', r.cuposPublicados],
      ['Cupos reservados', r.cuposReservados],
      ['Cupos disponibles', r.cuposDisponibles],
      ['Ocupación (%)', r.porcentajeOcupacion === null ? 'Sin disponibilidad registrada' : r.porcentajeOcupacion],
      ['Ingresos estimados (COP)', Number(r.ingresosEstimados)],
      [],
      ['Por servicio'],
      ['Servicio', 'Reservas', 'Canceladas', 'Cupos publicados', 'Cupos reservados', 'Ocupación (%)'],
      ...report.porServicio.map((row) => [
        row.servicio,
        row.reservas,
        row.canceladas,
        row.cuposPublicados,
        row.cuposReservados,
        row.porcentajeOcupacion === null ? '' : row.porcentajeOcupacion,
      ]),
      [],
      ['Detalle de reservas'],
      ['Fecha', 'Hora inicio', 'Hora fin', 'Servicio', 'Cliente', 'Estado', 'Valor (COP)'],
      ...report.reservas.map((row) => [
        formatBogota(row.inicio, { year: 'numeric', month: '2-digit', day: '2-digit' }),
        formatBogota(row.inicio, { hour: '2-digit', minute: '2-digit', hour12: false }),
        formatBogota(row.fin, { hour: '2-digit', minute: '2-digit', hour12: false }),
        row.servicio,
        row.cliente,
        row.estado === 'CANCELADA' ? 'Cancelada' : 'Confirmada',
        Number(row.precio),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-reservas_${report.desde}_a_${report.hasta}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify?.('Reporte exportado: el archivo CSV ya está en tus descargas y puedes abrirlo en Excel.');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
            <BarChart3 className="h-3.5 w-3.5" />
            Módulo de analítica
            <span className="text-slate-300">•</span>
            <span className="font-semibold normal-case tracking-normal text-slate-500">Datos de tu cuenta</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#0b1c30] sm:text-3xl">
            Reportes y analítica de reservas
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            Revisa el comportamiento de tus servicios a partir de las reservas y horarios registrados.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-1">
            {([
              ['month', 'Este mes'],
              ['7', 'Últimos 7 días'],
              ['30', 'Últimos 30 días'],
              ['next30', 'Próximos 30 días'],
              ['year', 'Este año'],
              ['custom', 'Personalizado'],
            ] as [Period, string][]).map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setPeriod(value)}
                className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
                  period === value ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {period === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  aria-label="Fecha inicial"
                  type="date"
                  value={customStart}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-700 outline-none focus:border-blue-400"
                />
                <span className="text-slate-400">—</span>
                <input
                  aria-label="Fecha final"
                  type="date"
                  value={customEnd}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-700 outline-none focus:border-blue-400"
                />
              </div>
            )}
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="sr-only">Filtrar por servicio</span>
              <select
                aria-label="Filtrar por servicio"
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="max-w-48 bg-transparent font-semibold text-slate-700 outline-none"
              >
                <option value="all">Todos los servicios</option>
                {serviceOptions.map((service) => (
                  <option key={service.id} value={service.id}>{service.title}</option>
                ))}
              </select>
            </label>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <CalendarRange className="h-3.5 w-3.5" />
              {periodLabel}
            </span>
          </div>
        </div>
      </section>

      {rangeError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{rangeError}</span>
        </div>
      )}
      {!rangeError && loadError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}
      {!rangeError && !loadError && report && totalRows === 0 && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {serviceFilter === 'all'
              ? 'No se encontraron reservas para el periodo consultado.'
              : 'No se encontraron resultados para los filtros seleccionados.'}
          </span>
        </div>
      )}

      <section
        aria-busy={isLoading}
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 transition-opacity ${isLoading ? 'opacity-60' : ''}`}
      >
        <MetricCard
          label="Reservas en el periodo"
          value={String(confirmedCount)}
          detail={`Confirmadas · ${serviceLabel}`}
          icon={<CalendarDays className="h-4 w-4" />}
          color="blue"
        />
        <MetricCard
          label="Ocupación de cupos"
          value={occupancy === null ? '—' : `${occupancy.toFixed(1)}%`}
          detail={
            slotCapacity > 0
              ? `${occupiedCapacity} usados · ${freeCapacity} disponibles de ${slotCapacity} cupos`
              : 'No existe disponibilidad registrada para el periodo consultado'
          }
          icon={<TrendingUp className="h-4 w-4" />}
          color="indigo"
        />
        <MetricCard
          label="Ingresos estimados"
          value={formatCurrency(estimatedRevenue)}
          detail="Reservas confirmadas × precio actual del servicio"
          icon={<span className="text-sm font-extrabold">$</span>}
          color="emerald"
        />
        <MetricCard
          label="Tasa de cancelación"
          value={`${cancellationRate.toFixed(1)}%`}
          detail={`${cancelledCount} canceladas de ${totalRows} reservas registradas`}
          icon={<XCircle className="h-4 w-4" />}
          color="amber"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-extrabold text-slate-800">Evolución de reservas</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Distribución de reservas confirmadas y canceladas</p>
            </div>
            <div className="flex gap-3 text-[10px] font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-700" />Confirmadas</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-400" />Canceladas</span>
            </div>
          </div>
          {trend.length ? (
            <div className="mt-4">
              <svg viewBox="0 0 500 170" role="img" aria-label="Gráfico de reservas por periodo" className="h-44 w-full overflow-visible">
                {[0, 1, 2, 3].map((line) => {
                  const y = 26 + line * 37;
                  return <line key={line} x1="28" x2="472" y1={y} y2={y} stroke="#e9eef6" strokeDasharray="3 4" />;
                })}
                <polyline points={chartPoints('confirmed')} fill="none" stroke="#155eef" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={chartPoints('cancelled')} fill="none" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {trend.map((bucket, index) => {
                  const x = trend.length === 1 ? 250 : 28 + (index * 444) / (trend.length - 1);
                  const y = 138 - (bucket.confirmed / trendMaximum) * 112;
                  return <circle key={bucket.start} cx={x} cy={y} r="3" fill="#155eef" stroke="white" strokeWidth="2" />;
                })}
              </svg>
              <div className="flex justify-between px-1 text-[9px] text-slate-400">
                <span>{trend[0].label}</span>
                {trend.length > 2 && <span>{trend[Math.floor(trend.length / 2)].label}</span>}
                <span>{trend[trend.length - 1].label}</span>
              </div>
            </div>
          ) : (
            <EmptyState message="No hay reservas registradas en este periodo." />
          )}
          <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
            El informe incluye únicamente los registros disponibles para esta cuenta y el rango seleccionado.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
          <div>
            <h2 className="font-display text-sm font-extrabold text-slate-800">Reservas por servicio</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Participación en el volumen del periodo</p>
          </div>
          {serviceBreakdown.length ? (
            <>
              <div className="my-5 flex items-center justify-center">
                <div
                  className="relative flex h-36 w-36 items-center justify-center rounded-full"
                  style={{ background: donutGradient }}
                  role="img"
                  aria-label={`Distribución de ${totalServiceBookings} reservas por servicio`}
                >
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white">
                    <span className="font-display text-2xl font-extrabold text-slate-800">{totalServiceBookings}</span>
                    <span className="text-[9px] text-slate-500">Reservas</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                {serviceBreakdown.slice(0, 5).map((service, index) => (
                  <div key={service.serviceId} className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                      <i className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: serviceColors[index % serviceColors.length] }} />
                      <span className="truncate">{service.title}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-slate-700">
                      {service.total} · {totalServiceBookings ? ((service.total / totalServiceBookings) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
                {serviceBreakdown.length > 5 && (
                  <p className="text-[10px] text-slate-400">y {serviceBreakdown.length - 5} servicios más</p>
                )}
              </div>
            </>
          ) : (
            <EmptyState message="Aún no hay reservas para distribuir." />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-extrabold text-slate-800">Días y horarios de demanda</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Reservas confirmadas agrupadas por día de semana y franja horaria</p>
          </div>
          <div className="flex flex-wrap gap-3 text-[9px] text-slate-500">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-blue-100" />Menor</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-blue-400" />Media</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-blue-800" />Mayor</span>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-1 text-center">
            <thead>
              <tr className="text-[10px] font-bold text-slate-500">
                <th className="pb-2 text-left">Día</th>
                <th className="pb-2">Mañana<br /><span className="font-normal">06:00–12:00</span></th>
                <th className="pb-2">Tarde<br /><span className="font-normal">12:00–18:00</span></th>
                <th className="pb-2">Noche<br /><span className="font-normal">18:00–24:00</span></th>
              </tr>
            </thead>
            <tbody>
              {demandByDay.map((day) => (
                <tr key={day.day}>
                  <th className="py-1 text-left text-[10px] font-semibold text-slate-600">{day.label}</th>
                  {day.counts.map((count, index) => {
                    const intensity = count / maxDemand;
                    const tone = count === 0
                      ? 'bg-slate-50 text-slate-300'
                      : intensity > 0.65
                        ? 'bg-blue-800 text-white'
                        : intensity > 0.3
                          ? 'bg-blue-400 text-white'
                          : 'bg-blue-100 text-blue-800';
                    return (
                      <td key={index}>
                        <div className={`rounded-md py-2 text-[11px] font-bold ${tone}`} title={`${count} reservas`}>
                          {count}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <div>
            <h2 className="font-display text-sm font-extrabold text-slate-800">Desglose por servicio</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Reservas e ingresos estimados de los servicios con actividad en el rango</p>
          </div>
          <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700">
            {serviceBreakdown.length} {serviceBreakdown.length === 1 ? 'servicio' : 'servicios'}
          </span>
        </div>
        {serviceBreakdown.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead className="bg-[#f5f7fc] text-[9px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Servicio</th>
                  <th className="px-4 py-3 text-center">Reservas</th>
                  <th className="px-4 py-3">Confirmadas / canceladas</th>
                  <th className="px-4 py-3 text-right">Ingreso estimado</th>
                  <th className="px-5 py-3 text-right">Participación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceBreakdown.map((service) => (
                  <tr key={service.serviceId} className="text-xs hover:bg-slate-50/70">
                    <td className="px-5 py-3 font-semibold text-slate-800">{service.title}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{service.total}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-600">{service.confirmed} conf.</span>
                        <span className="text-rose-500">{service.cancelled} canc.</span>
                      </div>
                      <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-rose-100">
                        <div
                          className="h-full rounded-full bg-blue-700"
                          style={{ width: `${service.total ? (service.confirmed / service.total) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-900">{formatCurrency(service.revenue)}</td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {filteredBookings.length ? ((service.total / filteredBookings.length) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-t border-slate-100"><EmptyState message="No hay servicios con reservas en este periodo." /></div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-[10px] text-slate-500">
          <span>{confirmedCount} confirmadas · {cancelledCount} canceladas · {formatCurrency(estimatedRevenue)} estimados</span>
          <span>El ingreso se calcula con el precio actual de cada servicio.</span>
        </div>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  color: 'blue' | 'indigo' | 'emerald' | 'amber';
}> = ({ label, value, detail, icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${colors[color]}`}>{icon}</span>
      </div>
      <div className="mt-3 truncate font-display text-2xl font-extrabold text-[#0b1c30]" title={value}>{value}</div>
      <p className="mt-1 min-h-4 text-[10px] text-slate-500">{detail}</p>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
      <Clock3 className="h-4 w-4" />
    </div>
    <p className="text-xs text-slate-500">{message}</p>
  </div>
);
