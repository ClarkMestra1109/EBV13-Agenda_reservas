import React, { useEffect, useState } from 'react';
import { Booking, AvailabilitySlot } from '../../types';
import { X, CalendarDays, Save } from 'lucide-react';

interface RescheduleBookingModalProps {
  booking: Booking | null;
  onClose: () => void;
  onLoadSlots: (servicioId: number) => Promise<AvailabilitySlot[]>;
  onConfirmReschedule: (bookingId: string, newSlotId: string) => Promise<void>;
}

export const RescheduleBookingModal: React.FC<RescheduleBookingModalProps> = ({
  booking,
  onClose,
  onLoadSlots,
  onConfirmReschedule,
}) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!booking) return;

    setSelectedSlotId('');
    setError(null);
    setIsLoading(true);

    onLoadSlots(Number(booking.serviceId))
      .then((result) => {
        const candidatos = result.filter(
          (slot) =>
            String(slot.id) !== String(booking.franjaId) &&
            (slot.cuposDisponibles ?? 0) > 0
        );
        setSlots(candidatos);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'No fue posible cargar los horarios disponibles.');
      })
      .finally(() => setIsLoading(false));
  }, [booking, onLoadSlots]);

  if (!booking) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedSlotId) {
      setError('Selecciona un nuevo horario para reprogramar la cita.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirmReschedule(booking.id, selectedSlotId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reprogramar la reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative space-y-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Reprogramar reserva</h3>
            <p className="text-xs text-slate-500">Selecciona otro horario publicado que siga disponible.</p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <p className="font-bold text-slate-800">{booking.serviceTitle}</p>
          <p className="text-slate-500">
            Fecha actual: <span className="font-semibold text-slate-700">{booking.date} — {booking.time}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="reschedule-slot" className="block font-bold text-slate-700 mb-1.5">
              Nuevo horario disponible
            </label>
            <select
              id="reschedule-slot"
              required
              value={selectedSlotId}
              disabled={isLoading}
              onChange={(event) => {
                setSelectedSlotId(event.target.value);
                setError('');
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="" disabled>
                {isLoading ? 'Cargando horarios...' : 'Selecciona una franja...'}
              </option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.fullDate} · {slot.timeRange}
                </option>
              ))}
            </select>
            {!isLoading && slots.length === 0 && (
              <p className="mt-2 text-slate-500">
                No hay otros horarios disponibles publicados para este servicio.
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-red-700">
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedSlotId || isSubmitting}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Enviando…' : 'Confirmar nuevo horario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
