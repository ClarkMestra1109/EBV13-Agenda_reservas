import React, { useState } from 'react';
import { Booking, CurrentView } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Video,
  FileText,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';

interface ClientReservationsProps {
  bookings: Booking[];
  onNavigate: (view: CurrentView) => void;
  onCancelBooking: (booking: Booking) => void;
}

export const ClientReservations: React.FC<ClientReservationsProps> = ({
  bookings,
  onNavigate,
  onCancelBooking,
}) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'cancelled'>('upcoming');

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  const pastBookings = [
    {
      id: 'AP-8772',
      service: 'Entrenamiento Personalizado Funcional',
      provider: 'Coach Valentina',
      date: '18 Octubre 2024',
      price: '$35.000 COP',
      status: 'Completada',
      rating: '5★ Calificado',
    },
    {
      id: 'AP-8740',
      service: 'Mantenimiento Preventivo Portátil',
      provider: 'Felipe Mendoza',
      date: '12 Octubre 2024',
      price: '$75.000 COP',
      status: 'Completada',
      rating: '5★ Calificado',
    },
    {
      id: 'AP-8711',
      service: 'Corte Clásico & Barba',
      provider: 'Laura Morales Studio',
      date: '28 Septiembre 2024',
      price: '$25.000 COP',
      status: 'Completada',
      rating: '5★ Calificado',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header info bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">
            Mis Reservas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra tus citas programadas, enlaces de acceso virtual e historial de servicios
          </p>
        </div>

        <button
          onClick={() => onNavigate('client-explore')}
          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Agendar nuevo servicio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'upcoming'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Próximas reservas</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold">
            {upcomingBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Historial y Pasadas</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold">
            {pastBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('cancelled')}
          className={`pb-3 font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'cancelled'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Canceladas</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold">
            {cancelledBookings.length}
          </span>
        </button>
      </div>

      {/* Tab: Upcoming */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs hover:border-blue-200 transition-all grid grid-cols-1 md:grid-cols-12 gap-5 items-center"
            >
              <div className="md:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    {b.locationName}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">{b.category}</span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {b.status === 'confirmed' ? '✓ Confirmada' : '⏳ Pendiente de confirmación'}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-[#0b1c30] font-display">
                  {b.serviceTitle}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">FECHA</span>
                      <span className="font-bold text-slate-800">{b.date}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">HORA</span>
                      <span className="font-bold text-slate-800">{b.time}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">MODALIDAD</span>
                      <span className="font-bold text-slate-800">{b.modality}</span>
                    </div>
                  </div>
                </div>

                {b.notes && (
                  <p className="text-xs text-slate-500 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                    <strong className="text-blue-900 font-semibold">Nota: </strong>
                    {b.notes}
                  </p>
                )}
              </div>

              <div className="md:col-span-4 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 space-y-3 w-full">
                <div className="text-right w-full">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    VALOR ACORDADO
                  </span>
                  <span className="text-xl font-extrabold text-blue-700 font-display">
                    ${b.price.toLocaleString('es-CO')} COP
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Pago al profesional
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full">
                  {b.isVirtual || b.modality === 'Virtual' ? (
                    <a
                      href={b.meetingUrl || 'https://meet.google.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Ingresar a Meet</span>
                    </a>
                  ) : null}

                  <button
                    onClick={() => onCancelBooking(b)}
                    className="w-full py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors text-center"
                  >
                    Cancelar reserva
                  </button>
                </div>
              </div>
            </div>
          ))}

          {upcomingBookings.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No tienes reservas activas</p>
              <p className="text-xs text-slate-500">
                Explora el catálogo y reserva con los mejores profesionales en tu ciudad.
              </p>
              <button
                onClick={() => onNavigate('client-explore')}
                className="text-xs font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-xl"
              >
                Explorar catálogo de servicios
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                <th className="py-3 px-4">Servicio & Proveedor</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {pastBookings.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{item.service}</div>
                    <div className="text-[11px] text-slate-400">{item.provider}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{item.date}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{item.price}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      ✓ {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Descargando comprobante fiscal ${item.id}.pdf`)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Cancelled */}
      {activeTab === 'cancelled' && (
        <div className="space-y-4">
          {cancelledBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between opacity-80"
            >
              <div>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  Cancelada
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">{b.serviceTitle}</h4>
                <p className="text-xs text-slate-500">
                  {b.date} • {b.time} • {b.locationName}
                </p>
                {b.notes && (
                  <p className="text-[11px] text-slate-400 mt-1 italic">Motivo: {b.notes}</p>
                )}
              </div>
              <button
                onClick={() => onNavigate('client-explore')}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Volver a agendar</span>
              </button>
            </div>
          ))}

          {cancelledBookings.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No tienes ninguna reserva cancelada.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
