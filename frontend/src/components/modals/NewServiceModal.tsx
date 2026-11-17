import React, { useEffect, useState } from 'react';
import { ServiceItem } from '../../types';
import { X, Briefcase, Plus, Save } from 'lucide-react';
import { PRECIO_MAXIMO, formatearCOP, interpretarPrecio } from '../../utils/validation';

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

const DURACION_MIN = 5;
const DURACION_MAX = 480;

export const NewServiceModal: React.FC<NewServiceModalProps> = ({
  isOpen,
  onClose,
  onAddService,
  onUpdateService,
  serviceToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
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
      setPrice('');
      setDuration('');
      setDescription('');
    }
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, serviceToEdit]);

  if (!isOpen) return null;

  const precioInterpretado = interpretarPrecio(price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nombre = title.trim();
    if (nombre.length < 3) {
      setError('El nombre del servicio debe tener al menos 3 caracteres.');
      return;
    }
    if (nombre.length > 100) {
      setError('El nombre del servicio no puede superar 100 caracteres.');
      return;
    }

    if (!price.trim()) {
      setError('La tarifa es obligatoria.');
      return;
    }
    const precioNum = interpretarPrecio(price);
    if (precioNum === null) {
      setError('La tarifa debe ser un número con máximo 2 decimales. Ejemplos: 35000, 35.000 o 35000,50.');
      return;
    }
    if (precioNum <= 0) {
      setError('La tarifa debe ser mayor que 0.');
      return;
    }
    if (precioNum > PRECIO_MAXIMO) {
      setError(`La tarifa no puede superar ${formatearCOP(PRECIO_MAXIMO)}.`);
      return;
    }

    const duracionNum = Number(duration);
    if (!duration.trim() || !Number.isInteger(duracionNum)) {
      setError('La duración debe ser un número entero de minutos, sin decimales.');
      return;
    }
    if (duracionNum < DURACION_MIN || duracionNum > DURACION_MAX) {
      setError(`La duración debe estar entre ${DURACION_MIN} y ${DURACION_MAX} minutos (8 horas).`);
      return;
    }

    const descripcion = description.trim();
    if (!descripcion) {
      setError('La descripción es obligatoria: cuéntale al cliente qué incluye el servicio.');
      return;
    }
    if (descripcion.length > 255) {
      setError('La descripción no puede superar 255 caracteres.');
      return;
    }

    const payload: ServicioFormData = {
      title: nombre,
      price: precioNum,
      durationMinutes: duracionNum,
      description: descripcion,
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

  const inputClass =
    'w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
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

        {/* noValidate: las validaciones se hacen en handleSubmit para mostrar mensajes claros
            en español dentro del formulario, en vez de los globos del navegador. */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="servicio-nombre" className="block font-bold text-slate-700 mb-1">
              Nombre del servicio
            </label>
            <input
              id="servicio-nombre"
              type="text"
              maxLength={100}
              placeholder="Ej: Afeitado Tradicional con Toalla Caliente"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="servicio-precio" className="block font-bold text-slate-700 mb-1">
                Tarifa (COP)
              </label>
              <input
                id="servicio-precio"
                type="text"
                inputMode="decimal"
                maxLength={16}
                placeholder="Ej: 35000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-[10px] text-slate-500 min-h-[14px]">
                {price.trim() && precioInterpretado !== null && precioInterpretado > 0
                  ? `Se guardará como ${formatearCOP(precioInterpretado)}`
                  : 'Puedes usar puntos de miles y hasta 2 decimales.'}
              </p>
            </div>

            <div>
              <label htmlFor="servicio-duracion" className="block font-bold text-slate-700 mb-1">
                Duración (minutos)
              </label>
              <input
                id="servicio-duracion"
                type="number"
                inputMode="numeric"
                min={DURACION_MIN}
                max={DURACION_MAX}
                step={1}
                placeholder="Ej: 45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Entre {DURACION_MIN} y {DURACION_MAX} minutos.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="servicio-descripcion" className="block font-bold text-slate-700 mb-1">
              Descripción detallada
            </label>
            <textarea
              id="servicio-descripcion"
              rows={2}
              maxLength={255}
              placeholder="Explica qué incluye el servicio y los beneficios para el cliente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            ></textarea>
            <p className="mt-0.5 text-[10px] text-slate-400 text-right">{description.length}/255</p>
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
