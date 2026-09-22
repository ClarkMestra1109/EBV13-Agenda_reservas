import React, { useEffect, useMemo, useState } from 'react';
import { createBooking, getAvailableSlots } from '../../services/api';
import {
 ServiceItem, Booking, CurrentView, AvailabilitySlot } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  Star,
  Check,
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ClientBookingProps {
  service: ServiceItem;
  onNavigate: (view: CurrentView) => void;
  onConfirmNewBooking: (newBooking: Booking) => Promise<void> | void;
}

export const ClientBooking: React.FC<ClientBookingProps> = ({
  service,
  onNavigate,
  onConfirmNewBooking,
}) => {
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [clientNotes, setClientNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadSlots = async () => {
      setIsLoadingSlots(true);
      setLoadError(null);
      setSelectedSlotId('');

      try {
        const backendId = service.backendId || Number(service.id);
        const response = await getAvailableSlots(backendId);

        const mapped = response
          .filter((slot) => slot.cuposDisponibles > 0)
          .map((slot) => ({
            id: String(slot.id),
            dayLabel: 'HOY' as AvailabilitySlot['dayLabel'],
            fullDate: new Intl.DateTimeFormat('es-CO', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }).format(new Date(slot.inicio)),
            timeRange: `${new Intl.DateTimeFormat('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }).format(new Date(slot.inicio))} - ${new Intl.DateTimeFormat('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }).format(new Date(slot.fin))}`,
            capacityText: `${slot.cuposDisponibles} cupo${slot.cuposDisponibles === 1 ? '' : 's'} disponible${slot.cuposDisponibles === 1 ? '' : 's'}`,
            serviceTag: service.title,
            isBooked: false,
            serviceId: String(slot.servicioId),
            inicio: slot.inicio,
            fin: slot.fin,
            cupoTotal: slot.cupoTotal,
            cuposDisponibles: slot.cuposDisponibles,
          }));

        setAvailableSlots(mapped);
        if (mapped.length > 0) {
          setSelectedSlotId(mapped[0].id);
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'No fue posible cargar los horarios');
      } finally {
        setIsLoadingSlots(false);
      }
    };

    void loadSlots();
  }, [service]);

  const daysList = useMemo(() => {
    const groups = new Map<string, AvailabilitySlot[]>();

    for (const slot of availableSlots) {
      const key = new Date(slot.inicio!).toDateString();
      const current = groups.get(key) || [];
      current.push(slot);
      groups.set(key, current);
    }

    return Array.from(groups.values()).map((daySlots) => {
      const first = daySlots[0];
      const date = new Date(first.inicio!);

      return {
        key: date.toDateString(),
        label: new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(date).replace('.', ''),
        dateNum: new Intl.DateTimeFormat('es-CO', { day: '2-digit' }).format(date),
        full: first.fullDate,
        slotsCount: `${daySlots.length} libre${daySlots.length === 1 ? '' : 's'}`,
      };
    });
  }, [availableSlots]);

  useEffect(() => {
    if (daysList.length === 0) {
      setSelectedDayIndex(0);
      return;
    }

    if (selectedDayIndex >= daysList.length) {
      setSelectedDayIndex(0);
    }
  }, [daysList, selectedDayIndex]);

  const selectedDaySlots = useMemo(() => {
    const selectedDay = daysList[selectedDayIndex];
    if (!selectedDay) return [];

    return availableSlots.filter(
      (slot) => new Date(slot.inicio!).toDateString() === selectedDay.key
    );
  }, [availableSlots, daysList, selectedDayIndex]);

  useEffect(() => {
    if (daysList.length === 0) return;

    const selectedDay = daysList[selectedDayIndex];
    const currentSlot = availableSlots.find((slot) => slot.id === selectedSlotId);

    if (!currentSlot || new Date(currentSlot.inicio!).toDateString() !== selectedDay.key) {
      const firstSlot = availableSlots.find(
        (slot) => new Date(slot.inicio!).toDateString() === selectedDay.key
      );
      if (firstSlot) setSelectedSlotId(firstSlot.id);
    }
  }, [daysList, selectedDayIndex, availableSlots, selectedSlotId]);

  const selectedSlot = availableSlots.find((slot) => slot.id === selectedSlotId);

  const handleBookNow = async () => {
    if (!selectedSlot) return;

    setIsSubmitting(true);

    try {
      const response = await createBooking(Number(selectedSlot.id));

      const newBooking: Booking = {
        id: String(response.id),
        clientName: response.clienteNombre,
        clientEmail: '',
        clientPhone: '',
        clientInitials: response.clienteNombre
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        serviceId: String(response.servicioId),
        serviceTitle: response.servicioNombre,
        category: service.category,
        locationName: response.proveedorNombre,
        date: new Intl.DateTimeFormat('es-CO', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }).format(new Date(response.inicio)),
        time: new Intl.DateTimeFormat('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(new Date(response.inicio)),
        timeSlotFormatted: `${new Intl.DateTimeFormat('es-CO', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        }).format(new Date(response.inicio))} • ${new Intl.DateTimeFormat('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(new Date(response.inicio))}`,
        durationMinutes: service.durationMinutes,
        price: service.price,
        status: 'confirmed',
        modality: 'Presencial',
        notes: clientNotes || undefined,
        backendInicio: response.inicio,
        backendFin: response.fin,
        franjaId: response.franjaId,
      };

      await onConfirmNewBooking(newBooking);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No fue posible confirmar la reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => onNavigate('client-explore')}
          className="hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al catálogo</span>
        </button>
        <span>/</span>
        <span className="text-slate-400">{service.category}</span>
        <span>/</span>
        <span className="text-slate-800 font-bold">{service.title}</span>
      </div>

      {/* Service Preview Banner (Image 22) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 h-48 rounded-2xl overflow-hidden relative shadow-xs">
          <img
            src={service.imageUrl}
            alt={service.title}
            className="w-full h-full object-cover"
          />
          <span className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md">
            {service.modalityBadge}
          </span>
        </div>

        <div className="md:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              {service.providerStudio}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-slate-800">{service.rating}</span>
              <span className="text-slate-400 font-normal">({service.reviewsCount} reseñas)</span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">
            {service.title}
          </h1>

          <p className="text-xs text-slate-600 leading-relaxed">
            {service.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{service.durationMinutes} minutos de duración</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Sede Chicó Norte, Cra 15 # 93-40, Bogotá</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Cancelación gratuita hasta 4h antes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Booking Area: Date & Slot Matrix (Left) + Summary Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (8 cols): Interactive Calendar + Slots */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Strip Calendar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-extrabold text-[#0b1c30] font-display">
                  Selecciona la fecha de tu cita
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-700">{daysList[selectedDayIndex]?.full || "Sin disponibilidad"}</span>
            </div>

            {/* Strip Days */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {daysList.map((day, idx) => (
                <button
                  key={day.dateNum}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`p-3 rounded-2xl text-center border transition-all flex flex-col items-center justify-between h-24 ${
                    selectedDayIndex === idx
                      ? 'bg-blue-700 text-white border-blue-700 shadow-md shadow-blue-700/20'
                      : 'bg-white hover:border-blue-300 border-slate-200/80 text-slate-800'
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold ${
                      selectedDayIndex === idx ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {day.label}
                  </span>
                  <span className="text-xl font-extrabold font-display">{day.dateNum}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      selectedDayIndex === idx
                        ? 'bg-blue-800 text-blue-100'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {day.slotsCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Time Slots Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-extrabold text-[#0b1c30] font-display">
                  Selecciona la franja horaria disponible
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {daysList[selectedDayIndex]?.full || 'Sin disponibilidad'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedDaySlots.map((slot) => {
                const isBooked = (slot.cuposDisponibles || 0) <= 0;
                const isSelected = selectedSlotId === slot.id && !isBooked;

                return (
                  <button
                    key={slot.id}
                    disabled={isBooked}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                      isBooked
                        ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed line-through'
                        : isSelected
                        ? 'bg-blue-700 text-white border-blue-700 shadow-sm shadow-blue-700/20'
                        : 'bg-white hover:border-blue-300 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{slot.timeRange.split(' - ')[0]}</span>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                    ) : isBooked ? (
                      <span className="text-[9px] font-normal text-slate-400">Ocupado</span>
                    ) : (
                      <span className="text-[9px] font-normal text-emerald-600">Libre</span>
                    )}
                  </button>
                );
              })}
            </div>

            {isLoadingSlots && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-700">
                Cargando horarios disponibles...
              </div>
            )}

            {!isLoadingSlots && loadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700">
                {loadError}
              </div>
            )}

            {!isLoadingSlots && !loadError && availableSlots.length === 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                Este servicio no tiene franjas futuras disponibles.
              </div>
            )}

            {/* Optional Notes */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Notas adicionales para el profesional (opcional):
              </label>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Ejemplo: Deseo degradado medio (mid fade) y perfilado con toalla caliente..."
                rows={2}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
              ></textarea>
            </div>
          </div>

          {/* Provider Bio Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC01S9TmngYbMx1mcz1769UTr0MwfdANXcck-mr_a1Aky0nR-UOZpZIBD8QP316pQqWVSJVPCEKbsZIWVWBoqAl1IJOLpSB3shCG2Z9ta8dgVJbfTd5Vya-qoOl2Pc6CfyIpLI_CJSYdsXf8MAFzBtstqUjSZIR4bJXsscMm4YNhIMpiVnWTv3bDmrwkADMfgOwRYn1eCKQSHefjoxh0N0zD-IPnuE427de4wwSgFq9ePhQVf_Fu_Q5dQ"
              alt="Laura Morales"
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 font-display">
                  Laura Morales
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  Master Barber
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Especialista en visagismo masculino y diseño de barbas en Bogotá Chicó Norte.
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">
                ✓ Protocolos de higiene y esterilización de instrumental certificados.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col (4 cols): Sticky Summary Drawer (Image 22) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs sticky top-24 space-y-5">
            <h3 className="text-base font-extrabold text-[#0b1c30] font-display pb-3 border-b border-slate-100">
              Resumen de tu Reserva
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  SERVICIO SELECCIONADO
                </span>
                <span className="font-bold text-slate-900 text-sm">{service.title}</span>
                <span className="text-slate-500 block text-[11px]">{service.providerStudio}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">FECHA</span>
                  <span className="font-bold text-slate-800">
                    {daysList[selectedDayIndex]?.full || 'Sin disponibilidad'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">HORA</span>
                  <span className="font-bold text-blue-700">{selectedSlot ? selectedSlot.timeRange.split(' - ')[0] : 'Selecciona una hora'}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 block">Sede Presencial</span>
                  Cra 15 # 93-40, Chicó Norte, Bogotá
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Tarifa del servicio</span>
                <span className="font-bold text-slate-800">
                  ${service.price.toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Comisión de plataforma</span>
                <span className="font-bold text-emerald-600">Bonificado ($0)</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900">
                <span>Total a pagar</span>
                <span className="text-blue-700 text-lg font-display">
                  ${service.price.toLocaleString('es-CO')} COP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Pago presencial en el local o transferencia al finalizar el servicio.
              </p>
            </div>

            {/* CTA Confirm Button */}
            <button
              id="confirm-booking-cta"
              disabled={isSubmitting || !selectedSlot}
              onClick={handleBookNow}
              className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-700/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Procesando reserva...</span>
                </>
              ) : (
                <>
                  <span>Confirmar reserva ahora</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Garantía de cita verificada AgendaPro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
