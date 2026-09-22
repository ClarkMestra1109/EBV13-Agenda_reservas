import React from 'react';
import { Booking } from '../../types';
import { CheckCircle2, Calendar, Clock, MapPin, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface BookingConfirmationModalProps {
  booking: Booking | null;
  onClose: () => void;
  onGoToReservations: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  onClose,
  onGoToReservations,
}) => {
  if (!booking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative space-y-5 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-[#0b1c30] tracking-tight font-display">
            ¡Reserva Confirmada!
          </h3>
          <p className="text-xs text-slate-500">
            Tu cita ha sido agendada y registrada en el sistema de AgendaPro.
          </p>
        </div>

        {/* Code Voucher */}
        <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100 text-center">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
            CÓDIGO DE RESERVA
          </span>
          <span className="text-lg font-black text-blue-900 font-display">
            #{booking.id}
          </span>
        </div>

        {/* Booking Details */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">SERVICIO</span>
            <span className="font-bold text-slate-800">{booking.serviceTitle}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">FECHA</span>
              <span className="font-bold text-slate-800">{booking.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">HORA</span>
              <span className="font-bold text-blue-700">{booking.time}</span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-200/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">LUGAR</span>
            <span className="font-bold text-slate-800">{booking.locationName}</span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Total a pagar:</span>
            <span className="font-extrabold text-blue-700 text-sm font-display">
              ${booking.price.toLocaleString('es-CO')} COP
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onGoToReservations}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-700/20"
          >
            <span>Ver en Mis Reservas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
};
