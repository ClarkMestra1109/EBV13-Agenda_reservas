import React, { useEffect, useMemo, useState } from 'react';
import { AvailabilitySlot } from '../../types';
import { Plus, Clock, Trash2, RefreshCw, History } from 'lucide-react';

interface ProviderAvailabilityProps {
  slots: AvailabilitySlot[];
  onOpenNewSlot: () => void;
  onDeleteSlot: (id: string) => void;
  /** Recarga horarios y reservas desde el servidor (los cupos cambian cuando los clientes reservan o cancelan). */
  onRefresh: () => Promise<void>;
}

const SlotCard: React.FC<{ slot: AvailabilitySlot; isPast: boolean; onDelete?: () => void }> = ({
  slot,
  isPast,
  onDelete,
}) => {
  const libres = slot.cuposDisponibles ?? 0;
  const total = slot.cupoTotal ?? 0;
  const lleno = libres <= 0;

  return (
    <div
      className={`bg-white p-5 rounded-2xl border shadow-xs transition-all flex flex-col justify-between ${
        isPast ? 'border-slate-200/60 opacity-70' : 'border-slate-200/80 hover:border-blue-200'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3 gap-2">
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            {slot.dayLabel} • {slot.fullDate}
          </span>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-slate-300 hover:text-red-600 p-1 rounded-lg transition-colors"
              title="Retirar horario"
              aria-label={`Retirar horario del ${slot.fullDate}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-base font-extrabold text-slate-900 font-display">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>{slot.timeRange}</span>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          <p>
            Cupos:{' '}
            <strong className="text-slate-800 font-bold">
              {libres} de {total} libre{total === 1 ? '' : 's'}
            </strong>
          </p>
          <p className="mt-0.5">
            Servicio: <span className="text-blue-700 font-semibold">{slot.serviceTag}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {isPast ? (
          <span className="text-slate-500 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Horario finalizado
          </span>
        ) : lleno ? (
          <span className="text-red-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Sin cupos
          </span>
        ) : (
          <span className="text-emerald-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Cupo disponible
          </span>
        )}
        {!isPast && (
          <span className="text-slate-400 text-[11px]">{lleno ? 'No reservable' : 'Visible para clientes'}</span>
        )}
      </div>
    </div>
  );
};

export const ProviderAvailability: React.FC<ProviderAvailabilityProps> = ({
  slots,
  onOpenNewSlot,
  onDeleteSlot,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Al entrar a la pantalla se consultan los cupos actuales: pueden haber cambiado porque un
  // cliente reservó o canceló desde su cuenta.
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { proximos, pasados } = useMemo(() => {
    const ahora = Date.now();
    const ordenados = [...slots].sort(
      (a, b) => Date.parse(a.inicio || '') - Date.parse(b.inicio || '')
    );
    return {
      proximos: ordenados.filter((slot) => Date.parse(slot.fin || slot.inicio || '') > ahora),
      pasados: ordenados.filter((slot) => Date.parse(slot.fin || slot.inicio || '') <= ahora).reverse(),
    };
  }, [slots]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">
            Disponibilidad y Franjas Horarias
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publica franjas horarias específicas para que tus clientes puedan reservar de forma automática.
            Si un horario usa un recurso que ya está lleno, tampoco se ofrece a los clientes.
          </p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={onOpenNewSlot}
            className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar nuevo horario</span>
          </button>
        </div>
      </div>

      {proximos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-500">
          No tienes horarios próximos publicados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proximos.map((slot) => (
            <SlotCard key={slot.id} slot={slot} isPast={false} onDelete={() => onDeleteSlot(slot.id)} />
          ))}
        </div>
      )}

      {pasados.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowPast(!showPast)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <History className="w-3.5 h-3.5" />
            {showPast ? 'Ocultar horarios pasados' : `Ver horarios pasados (${pasados.length})`}
          </button>
          {showPast && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pasados.map((slot) => (
                <SlotCard key={slot.id} slot={slot} isPast />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
