import React, { useState } from 'react';
import { Booking, CurrentView } from '../../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Download,
  Check,
  X,
  MapPin,
  Sparkles,
  Phone,
  Mail
} from 'lucide-react';

interface ProviderReservationsProps {
  bookings: Booking[];
  onConfirmBooking: (id: string) => void;
  onCancelBooking: (booking: Booking) => void;
  onNavigate: (view: CurrentView) => void;
}

export const ProviderReservations: React.FC<ProviderReservationsProps> = ({
  bookings,
  onConfirmBooking,
  onCancelBooking,
  onNavigate,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  const filtered = bookings.filter((b) => {
    if (activeFilter !== 'all' && b.status !== activeFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        b.clientName.toLowerCase().includes(q) ||
        b.serviceTitle.toLowerCase().includes(q) ||
        b.clientPhone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header (Image 24 top) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">
            Gestión de Reservas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisa, aprueba y administra todas las solicitudes de citas de tus clientes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Exportando lista de reservas en formato CSV/Excel...')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Status Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilter === 'all'
              ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Todas las reservas
          </span>
          <span className="text-2xl font-extrabold text-slate-900 font-display mt-1 block">
            {bookings.length}
          </span>
          <span className="text-[11px] text-blue-700 font-semibold">Total registradas</span>
        </button>

        <button
          onClick={() => setActiveFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilter === 'pending'
              ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Por Confirmar
          </span>
          <span className="text-2xl font-extrabold text-amber-600 font-display mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[11px] text-amber-700 font-semibold">Requieren acción</span>
        </button>

        <button
          onClick={() => setActiveFilter('confirmed')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilter === 'confirmed'
              ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Confirmadas
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 font-display mt-1 block">
            {confirmedCount}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold">Listas en agenda</span>
        </button>

        <button
          onClick={() => setActiveFilter('cancelled')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilter === 'cancelled'
              ? 'bg-slate-100 border-slate-600 ring-2 ring-slate-600/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Canceladas
          </span>
          <span className="text-2xl font-extrabold text-slate-600 font-display mt-1 block">
            {cancelledCount}
          </span>
          <span className="text-[11px] text-slate-500 font-semibold">Histórico</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, servicio, celular..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Solo pendientes</option>
            <option value="confirmed">Solo confirmadas</option>
            <option value="cancelled">Solo canceladas</option>
          </select>
        </div>
      </div>

      {/* Main Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-[#f9fafc]">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Servicio Solicitado</th>
                <th className="py-3 px-4">Fecha y Horario</th>
                <th className="py-3 px-4">Tarifa</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {b.clientAvatar ? (
                        <img
                          src={b.clientAvatar}
                          alt={b.clientName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {b.clientInitials}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900">{b.clientName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{b.clientPhone}</span>
                          <span>•</span>
                          <span>{b.clientEmail}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{b.serviceTitle}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600">
                        {b.modality}
                      </span>
                      <span>{b.locationName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{b.timeSlotFormatted}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{b.durationMinutes} minutos</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-blue-700">
                      ${b.price.toLocaleString('es-CO')} COP
                    </div>
                    <div className="text-[10px] text-slate-400">Sin anticipo</div>
                  </td>

                  <td className="py-3.5 px-4">
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

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => onConfirmBooking(b.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar</span>
                        </button>
                      )}

                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => onCancelBooking(b)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
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

        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            No se encontraron reservas con los filtros aplicados.
          </div>
        )}
      </div>
    </div>
  );
};
