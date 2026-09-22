import React, { useState } from 'react';
import { Booking } from '../../types';
import { AlertCircle, X } from 'lucide-react';

interface CancelBookingModalProps {
  booking: Booking | null;
  onClose: () => void;
  onConfirmCancel: (bookingId: string, reason: string) => void;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  booking,
  onClose,
  onConfirmCancel,
}) => {
  const [reason, setReason] = useState('Cambio imprevisto de itinerario');

  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-display">
              ¿Cancelar esta reserva?
            </h3>
            <p className="text-xs text-slate-500">
              Esta acción liberará el cupo en el sistema.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
          <p className="font-bold text-slate-800">{booking.serviceTitle}</p>
          <p className="text-slate-500">
            {booking.date} a las {booking.time}
          </p>
          <p className="text-blue-700 font-bold">
            ${booking.price.toLocaleString('es-CO')} COP
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Motivo de la cancelación:
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="Cambio imprevisto de itinerario">Cambio imprevisto de itinerario</option>
            <option value="Conflicto de horario laboral">Conflicto de horario laboral</option>
            <option value="Emergencia médica o personal">Emergencia médica o personal</option>
            <option value="Deseo reprogramar para otra fecha">Deseo reprogramar para otra fecha</option>
            <option value="Otro motivo">Otro motivo</option>
          </select>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={() => onConfirmCancel(booking.id, reason)}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Sí, cancelar cita
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Regresar
          </button>
        </div>
      </div>
    </div>
  );
};
