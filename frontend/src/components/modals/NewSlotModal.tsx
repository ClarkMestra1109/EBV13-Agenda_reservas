import React, { useState, useEffect } from 'react';
import { AvailabilitySlot, ServiceItem } from '../../types';
import { X, Clock, Plus, Repeat } from 'lucide-react';

export interface NuevaFranjaRecurrentePayload {
  serviceId: string;
  horaInicio: string;
  horaFin: string;
  diasSemana: number[]; // 0=domingo ... 6=sábado (como Date#getDay)
  repetirHasta: string;
  cupoTotal: number;
}

interface NewSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSlot: (slot: AvailabilitySlot) => Promise<void> | void;
  onAddRecurringSlots: (payload: NuevaFranjaRecurrentePayload) => Promise<void> | void;
  services: ServiceItem[];
}

const DIAS_LABEL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const NewSlotModal: React.FC<NewSlotModalProps> = ({
  isOpen,
  onClose,
  onAddSlot,
  onAddRecurringSlots,
  services,
}) => {
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [capacity, setCapacity] = useState('1');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [repeatUntil, setRepeatUntil] = useState('');

  useEffect(() => {
    if (services.length > 0 && !services.some((s) => s.id === serviceId)) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const resetForm = () => {
    setDate('');
    setStartTime('09:00');
    setEndTime('10:00');
    setCapacity('1');
    setRepeatWeekly(false);
    setSelectedDays([]);
    setRepeatUntil('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!serviceId || !startTime || !endTime) {
      setError('Completa servicio y horario.');
      return;
    }

    if (startTime >= endTime) {
      setError('El horario no es válido. La hora de fin debe ser posterior al inicio.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (repeatWeekly) {
        if (selectedDays.length === 0) {
          setError('Selecciona al menos un día de la semana.');
          setIsSubmitting(false);
          return;
        }
        if (!repeatUntil) {
          setError('Indica hasta qué fecha se repetirá.');
          setIsSubmitting(false);
          return;
        }

        await onAddRecurringSlots({
          serviceId,
          horaInicio: startTime,
          horaFin: endTime,
          diasSemana: selectedDays,
          repetirHasta: repeatUntil,
          cupoTotal: Number(capacity),
        });
      } else {
        if (!date) {
          setError('Selecciona una fecha.');
          setIsSubmitting(false);
          return;
        }

        const inicio = new Date(`${date}T${startTime}:00-05:00`);
        const fin = new Date(`${date}T${endTime}:00-05:00`);

        if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || fin <= inicio) {
          setError('El horario no es válido. La hora de fin debe ser posterior al inicio.');
          setIsSubmitting(false);
          return;
        }

        await onAddSlot({
          id: '',
          dayLabel: 'HOY',
          fullDate: date,
          timeRange: `${startTime} - ${endTime}`,
          capacityText: `${capacity} cupo(s)`,
          serviceTag:
            services.find((service) => service.id === serviceId)?.title || 'Servicio',
          isBooked: false,
          serviceId,
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
          cupoTotal: Number(capacity),
        });
      }

      resetForm();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No fue posible publicar la franja'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-display">
              Publicar Horario Libre
            </h3>
            <p className="text-xs text-slate-500">
              La franja quedará disponible en el backend para que un cliente la reserve.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Servicio</label>
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {services.length === 0 ? (
                <option value="">Primero crea un servicio</option>
              ) : (
                services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <label className="flex items-center gap-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={repeatWeekly}
              onChange={(e) => setRepeatWeekly(e.target.checked)}
              className="w-3.5 h-3.5 accent-blue-700"
            />
            <Repeat className="w-3.5 h-3.5 text-blue-700" />
            <span className="font-bold text-blue-900">Repetir semanalmente (HU12)</span>
          </label>

          {!repeatWeekly ? (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                required={!repeatWeekly}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Días de la semana</label>
                <div className="flex flex-wrap gap-1.5">
                  {DIAS_LABEL.map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                        selectedDays.includes(idx)
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Repetir hasta</label>
                <input
                  type="date"
                  required={repeatWeekly}
                  value={repeatUntil}
                  onChange={(e) => setRepeatUntil(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora de inicio</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora de fin</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cupos</label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700">
              {error}
            </div>
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
              disabled={isSubmitting || services.length === 0}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Publicando...' : 'Publicar horario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
