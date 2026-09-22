import React from 'react';
import { AvailabilitySlot } from '../../types';
import { Plus, Clock, Trash2, Calendar, CheckCircle2, Sparkles } from 'lucide-react';

interface ProviderAvailabilityProps {
  slots: AvailabilitySlot[];
  onOpenNewSlot: () => void;
  onDeleteSlot: (id: string) => void;
}

export const ProviderAvailability: React.FC<ProviderAvailabilityProps> = ({
  slots,
  onOpenNewSlot,
  onDeleteSlot,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">
            Disponibilidad y Franjas Horarias
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publica franjas horarias específicas para que tus clientes puedan reservar de forma automática
          </p>
        </div>

        <button
          onClick={onOpenNewSlot}
          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar nuevo horario</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                  {slot.dayLabel} • {slot.fullDate}
                </span>
                <button
                  onClick={() => onDeleteSlot(slot.id)}
                  className="text-slate-300 hover:text-red-600 p-1 rounded-lg transition-colors"
                  title="Eliminar franja"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-base font-extrabold text-slate-900 font-display">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>{slot.timeRange}</span>
              </div>

              <div className="mt-2 text-xs text-slate-500">
                <p>
                  Capacidad:{' '}
                  <strong className="text-slate-800 font-bold">{slot.capacityText}</strong>
                </p>
                <p className="mt-0.5">
                  Aplica para:{' '}
                  <span className="text-blue-700 font-semibold">{slot.serviceTag}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Cupo disponible
              </span>
              <span className="text-slate-400 text-[11px]">Visible en web</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
