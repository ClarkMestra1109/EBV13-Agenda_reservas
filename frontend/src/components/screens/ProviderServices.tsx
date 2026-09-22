import React from 'react';
import { ServiceItem, CurrentView } from '../../types';
import { Plus, Edit2, Trash2, Clock, MapPin, Star, CheckCircle2 } from 'lucide-react';

interface ProviderServicesProps {
  services: ServiceItem[];
  onOpenNewService: () => void;
  onNavigate: (view: CurrentView) => void;
  onToggleActive: (id: string) => void;
}

export const ProviderServices: React.FC<ProviderServicesProps> = ({
  services,
  onOpenNewService,
  onNavigate,
  onToggleActive,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">
            Mis Servicios Publicados
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura las tarifas, duración y descripción de los servicios visibles en tu catálogo público
          </p>
        </div>

        <button
          onClick={onOpenNewService}
          className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo servicio</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="h-44 relative overflow-hidden">
                <img
                  src={srv.imageUrl}
                  alt={srv.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                  {srv.modalityBadge}
                </span>
                <span className="absolute bottom-2.5 right-2.5 bg-white/95 text-blue-900 text-xs font-black px-2.5 py-1 rounded-xl shadow-xs">
                  ${srv.price.toLocaleString('es-CO')} COP
                </span>
              </div>

              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    {srv.category}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{srv.rating}</span>
                  </div>
                </div>

                <h3 className="text-sm font-extrabold text-[#0b1c30] font-display line-clamp-1">
                  {srv.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {srv.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{srv.durationMinutes} min</span>
                  </div>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Activo en catálogo
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center gap-2">
              <button
                onClick={() => alert(`Editando servicio: ${srv.title}`)}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => onToggleActive(srv.id)}
                className="px-3 py-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-slate-200 transition-colors"
                title="Pausar o despublicar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
