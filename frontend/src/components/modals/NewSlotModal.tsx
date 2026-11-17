import React, { useState, useEffect } from 'react';
import { AvailabilitySlot, ServiceItem } from '../../types';
import { X, Clock, Plus, Repeat } from 'lucide-react';
import {
  HORAS_MAX_FRANJA,
  MESES_MAX_ANTICIPACION,
  MESES_MAX_RECURRENCIA,
  fechaLegible,
  hoyBogota,
  sumarAFecha,
} from '../../utils/validation';

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
  services: allServices,
}) => {
  // Solo se pueden publicar horarios en servicios activos.
  const services = allServices.filter((service) => service.isActive);
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [capacity, setCapacity] = useState('1');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [repeatUntil, setRepeatUntil] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const primerServicioId = services[0]?.id || '';
  const servicioSigueDisponible = services.some((s) => s.id === serviceId);
  useEffect(() => {
    if (!servicioSigueDisponible && primerServicioId !== serviceId) {
      setServiceId(primerServicioId);
    }
  }, [servicioSigueDisponible, primerServicioId, serviceId]);

  // Al abrir el modal no debe quedar un error viejo de un intento anterior.
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Límites de fechas (hora de Colombia), iguales a los que valida el backend.
  const hoy = hoyBogota();
  const fechaMaxima = sumarAFecha(hoy, { meses: MESES_MAX_ANTICIPACION });
  const repetirDesde = sumarAFecha(hoy, { dias: 1 });
  const repetirMaximo = sumarAFecha(hoy, { meses: MESES_MAX_RECURRENCIA });
  const servicioElegido = services.find((service) => service.id === serviceId);

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

    const [hIni, mIni] = startTime.split(':').map(Number);
    const [hFin, mFin] = endTime.split(':').map(Number);
    const minutos = hFin * 60 + mFin - (hIni * 60 + mIni);
    if (servicioElegido && minutos < servicioElegido.durationMinutes) {
      setError(
        `El horario debe durar al menos ${servicioElegido.durationMinutes} minutos, que es la duración de "${servicioElegido.title}".`
      );
      return;
    }
    if (minutos > HORAS_MAX_FRANJA * 60) {
      setError(`Un horario no puede durar más de ${HORAS_MAX_FRANJA} horas.`);
      return;
    }

    const cupos = Number(capacity);
    if (!capacity.trim() || !Number.isInteger(cupos) || cupos < 1 || cupos > 100) {
      setError('Los cupos deben ser un número entero entre 1 y 100.');
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
        if (repeatUntil < repetirDesde) {
          setError('La fecha "Repetir hasta" debe ser posterior a hoy.');
          setIsSubmitting(false);
          return;
        }
        if (repeatUntil > repetirMaximo) {
          setError(
            `La repetición puede cubrir máximo ${MESES_MAX_RECURRENCIA} meses: elige una fecha hasta el ${fechaLegible(repetirMaximo)}.`
          );
          setIsSubmitting(false);
          return;
        }

        await onAddRecurringSlots({
          serviceId,
          horaInicio: startTime,
          horaFin: endTime,
          diasSemana: selectedDays,
          repetirHasta: repeatUntil,
          cupoTotal: cupos,
        });
      } else {
        if (!date) {
          setError('Selecciona una fecha.');
          setIsSubmitting(false);
          return;
        }
        if (date < hoy) {
          setError('La fecha ya pasó. Elige hoy o una fecha futura.');
          setIsSubmitting(false);
          return;
        }
        if (date > fechaMaxima) {
          setError(
            `Solo se pueden publicar horarios con máximo ${MESES_MAX_ANTICIPACION} meses de anticipación (hasta el ${fechaLegible(fechaMaxima)}).`
          );
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
        if (inicio.getTime() <= Date.now()) {
          setError('Esa hora de hoy ya pasó. Elige una hora de inicio posterior a la actual.');
          setIsSubmitting(false);
          return;
        }

        await onAddSlot({
          id: '',
          dayLabel: 'HOY',
          fullDate: date,
          timeRange: `${startTime} - ${endTime}`,
          capacityText: `${cupos} cupo(s)`,
          serviceTag:
            services.find((service) => service.id === serviceId)?.title || 'Servicio',
          isBooked: false,
          serviceId,
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
          cupoTotal: cupos,
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
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
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
              El horario quedará disponible para que tus clientes lo reserven.
            </p>
          </div>
        </div>

        {/* noValidate: los mensajes se muestran dentro del formulario, en español. */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Servicio</label>
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {services.length === 0 ? (
                <option value="">Primero crea o activa un servicio</option>
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
            <span className="font-bold text-blue-900">Repetir semanalmente</span>
          </label>

          {!repeatWeekly ? (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                min={hoy}
                max={fechaMaxima}
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
                  min={repetirDesde}
                  max={repetirMaximo}
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
              inputMode="numeric"
              min="1"
              max="100"
              step="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {error && (
            <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700">
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
