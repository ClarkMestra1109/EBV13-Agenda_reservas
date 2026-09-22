import React, { useState } from 'react';
import { X, Copy, Check, Share2, QrCode, ExternalLink } from 'lucide-react';

interface SharePublicLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenClientView: () => void;
}

export const SharePublicLinkModal: React.FC<SharePublicLinkModalProps> = ({
  isOpen,
  onClose,
  onOpenClientView,
}) => {
  const [copied, setCopied] = useState(false);
  const linkUrl = 'https://agendapro.app/lauramorales-studio';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(linkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Reserva tu cita conmigo en Laura Morales Studio a través de mi agenda online: ${linkUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative space-y-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
          <Share2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-slate-900 font-display">
            Enlace Público de Reserva
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tus clientes pueden ingresar aquí para ver tus servicios y cupos en tiempo real
          </p>
        </div>

        {/* QR Code preview */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 inline-block mx-auto">
          <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shadow-xs">
            {/* Clean SVG QR code representation */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
              <rect width="100" height="100" fill="white" />
              {/* Corners */}
              <rect x="10" y="10" width="25" height="25" fill="#0b1c30" rx="3" />
              <rect x="15" y="15" width="15" height="15" fill="white" rx="1.5" />
              <rect x="18" y="18" width="9" height="9" fill="#1d4ed8" rx="1" />

              <rect x="65" y="10" width="25" height="25" fill="#0b1c30" rx="3" />
              <rect x="70" y="15" width="15" height="15" fill="white" rx="1.5" />
              <rect x="73" y="18" width="9" height="9" fill="#1d4ed8" rx="1" />

              <rect x="10" y="65" width="25" height="25" fill="#0b1c30" rx="3" />
              <rect x="15" y="70" width="15" height="15" fill="white" rx="1.5" />
              <rect x="18" y="73" width="9" height="9" fill="#1d4ed8" rx="1" />

              {/* Data matrix dots */}
              <rect x="42" y="12" width="6" height="6" fill="#0b1c30" rx="1" />
              <rect x="52" y="12" width="6" height="6" fill="#0b1c30" rx="1" />
              <rect x="42" y="24" width="6" height="6" fill="#0b1c30" rx="1" />
              <rect x="47" y="34" width="6" height="6" fill="#1d4ed8" rx="1" />

              <rect x="12" y="44" width="6" height="6" fill="#0b1c30" rx="1" />
              <rect x="24" y="44" width="6" height="6" fill="#0b1c30" rx="1" />
              <rect x="34" y="44" width="6" height="6" fill="#0b1c30" rx="1" />
              <rect x="44" y="44" width="12" height="12" fill="#1d4ed8" rx="2" />
              <rect x="64" y="44" width="6" height="6" fill="#0b1c30" rx="1" />
              <rect x="78" y="44" width="10" height="6" fill="#0b1c30" rx="1" />

              <rect x="44" y="64" width="8" height="8" fill="#0b1c30" rx="1" />
              <rect x="58" y="64" width="8" height="8" fill="#0b1c30" rx="1" />
              <rect x="72" y="64" width="8" height="8" fill="#0b1c30" rx="1" />
              <rect x="84" y="74" width="6" height="16" fill="#0b1c30" rx="1" />
              <rect x="44" y="80" width="16" height="8" fill="#0b1c30" rx="1" />
              <rect x="66" y="80" width="10" height="8" fill="#1d4ed8" rx="1" />
            </svg>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 block font-medium">
            Escanea para reservar en tu teléfono
          </span>
        </div>

        {/* URL Input */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
          <span className="truncate text-slate-700 font-semibold pl-1 select-all">{linkUrl}</span>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {/* Share buttons */}
        <div className="space-y-2 pt-1 text-xs font-bold">
          <button
            onClick={handleWhatsApp}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Compartir por WhatsApp</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenClientView();
            }}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir vista previa del cliente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
