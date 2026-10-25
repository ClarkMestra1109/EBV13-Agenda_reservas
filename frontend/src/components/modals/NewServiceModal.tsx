import React, { useEffect, useState } from 'react';
import { ServiceItem } from '../../types';
import { X, Briefcase, Plus, Save } from 'lucide-react';

export interface ServicioFormData {
  title: string;
  price: number;
  durationMinutes: number;
  description: string;
}

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddService: (service: ServicioFormData) => Promise<void> | void;
  onUpdateService: (id: string, service: ServicioFormData) => Promise<void> | void;
  serviceToEdit: ServiceItem | null;
}

export const NewServiceModal: React.FC<NewServiceModalProps> = ({
  isOpen,
  onClose,
  onAddService,
  onUpdateService,
  serviceToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('35000');
  const [duration, setDuration] = useState('45');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(serviceToEdit);

  useEffect(() => {
    if (!isOpen) return;

    if (serviceToEdit) {
      setTitle(serviceToEdit.title);
      setPrice(String(serviceToEdit.price));
      setDuration(String(serviceToEdit.durationMinutes));
      setDescription(serviceToEdit.description || '');
    } else {
      setTitle('');
      setPrice('35000');
      setDuration('45');
      setDescription('');
    }
    setError(null);
  }, [isOpen, serviceToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('El nombre del servicio es obligatorio.');
      return;
    }

    const precioNum = parseInt(price, 10);
    const duracionNum = parseInt(duration, 10);

    if (!precioNum || precioNum <= 0) {
      setError('La tarifa debe ser un número mayor a 0.');
      return;
    }

    if (!duracionNum || duracionNum < 5 || duracionNum > 480) {
      setError('La duración debe estar entre 5 y 480 minutos.');
      return;
    }

    const payload: ServicioFormData = {
      title: title.trim(),
      price: precioNum,
      durationMinutes: duracionNum,
      description: description.trim() || 'Servicio profesional con atención personalizada.',
    };

    setIsSubmitting(true);
    try {
      if (serviceToEdit) {
        await onUpdateService(serviceToEdit.id, payload);
      } else {
        await onAddService(payload);
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `No fue posible ${serviceToEdit ? 'actualizar' : 'publicar'} el servicio`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-display">
              {isEditing ? 'Editar Servicio' : 'Publicar Nuevo Servicio'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Actualiza la tarifa, duración o descripción de este servicio.'
                : 'Añade un nuevo servicio disponible para reserva por tus clientes.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre del servicio</label>
            <input
              type="text"
              required
              placeholder="Ej: Afeitado Tradicional con Toalla Caliente"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tarifa (COP)</label>
              <input
                type="number"
                required
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Duración (minutos)</label>
              <input
                type="number"
                required
                min="5"
                max="480"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Descripción detallada</label>
            <textarea
              rows={2}
              placeholder="Explica qué incluye el servicio y los beneficios para el cliente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            ></textarea>
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
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>
                {isSubmitting
                  ? 'Guardando...'
                  : isEditing
                  ? 'Guardar cambios'
                  : 'Publicar servicio'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
