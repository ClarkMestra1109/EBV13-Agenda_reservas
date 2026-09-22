import React from 'react';
import { Booking, ServiceItem, CurrentView } from '../../types';
import {
  Compass,
  Calendar,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight
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
  // Find active booking for Carlos Mendoza (Corte & Perfilado Barbería)
  const nextBooking =
    bookings.find((b) => b.status === 'confirmed' || b.status === 'pending') || bookings[0];

  const recommendedServices = services.slice(1, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner (Image 16 & 18) */}
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
              Bienvenido a tu centro de citas y servicios personales en AgendaPro. Descubre servicios de alta calidad, reserva en horarios convenientes y administra tus citas programadas.
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

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
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
            <span className="text-3xl font-extrabold text-[#0b1c30] font-display">2</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Confirmadas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Próxima cita en 2 días</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Servicios Disfrutados
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0b1c30] font-display">8</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              Historial
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">100% de asistencia puntual</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Proveedores Favoritos
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0b1c30] font-display">4</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Guardados
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Laura Morales, David Silva, Coach V.</p>
        </div>
      </div>

      {/* Main Row: Próxima Reserva Destacada + Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Próxima Reserva (7-8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <h2 className="text-base font-extrabold text-[#0b1c30] font-display">
                Próxima Reserva Destacada
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Confirmada por el proveedor
            </span>
          </div>

          {/* Detailed reservation card */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-5 h-48 rounded-2xl overflow-hidden relative shadow-xs">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqkm1_lok8Tc3USmz772etYwFHhHM49Gyn5aW7aSdVlHaWTTjwWi-NeUyY2bPQghZQavnmodvKCMw4SxyCCsUQsoOSVrAeTYLFMrbQBHcFPPW_WoEd6b17DAw9YXGTZk3t8sXA_Iub_KF-ggwoBdYOr-VYrOVz0rxUvj-1rY8HaX3oxi_V8t5B40Q8bOThygceJxcQ0LvxbPSu4AddXF3E2yTY3NVXR1cOc1d6eYOR3WBr-61Czuv8WQ"
                alt="Corte Barbería"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-md">
                  Presencial
                </span>
                <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-md">
                  Cuidado Personal
                </span>
              </div>
            </div>

            <div className="md:col-span-7 space-y-3">
              <div>
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Barbería Urban • Laura Morales Studio
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 font-display">
                  Corte & Perfilado Barbería
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">FECHA Y HORA</span>
                    <span className="font-bold text-slate-800">Jueves 27 Oct, 11:00 AM</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">DURACIÓN</span>
                    <span className="font-bold text-slate-800">45 minutos</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Sede Chicó Norte, Carrera 15 # 93-40, Bogotá</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">VALOR ACORDADO</span>
                  <span className="text-base font-extrabold text-blue-700 font-display">
                    $25.000 COP
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => nextBooking && onCancelBooking(nextBooking)}
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
          </div>
        </div>

        {/* Right: Actividad Reciente (4-5 cols) */}
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
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Cita Confirmada</p>
                  <p className="text-slate-500 text-[11px]">
                    Laura Morales confirmó tu reserva para este Jueves a las 11:00 AM.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Hace 2 horas</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Recordatorio Programado</p>
                  <p className="text-slate-500 text-[11px]">
                    Recibirás un SMS y WhatsApp 2 horas antes de tu cita en la barbería.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Automático</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">Servicio Calificado</p>
                  <p className="text-slate-500 text-[11px]">
                    Calificaste con 5★ la Clase de Guitarra con David Silva.
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Ayer, 04:30 PM</span>
                </div>
              </div>
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

      {/* Servicios Recomendados para Ti (Image 16 & 18) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-[#0b1c30] font-display">
              Servicios Recomendados para Ti
            </h3>
            <p className="text-xs text-slate-500">
              Basados en tus preferencias y profesionales mejor calificados en Bogotá
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
                      {service.category}
                    </span>
                    <div className="flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{service.rating}</span>
                      <span className="text-slate-400 font-normal">({service.reviewsCount})</span>
                    </div>
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
      </div>
    </div>
  );
};
