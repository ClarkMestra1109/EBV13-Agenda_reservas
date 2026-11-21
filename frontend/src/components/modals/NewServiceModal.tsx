import React, { useEffect, useRef, useState } from 'react';
import { ServiceItem } from '../../types';
import { X, Briefcase, Plus, Save, ImagePlus, Trash2 } from 'lucide-react';
import { formatDuration } from '../../utils/formatDuration';
import { PRECIO_MAXIMO, formatearCOP, interpretarPrecio } from '../../utils/validation';

export interface ServicioFormData {
  title: string;
  price: number;
  durationMinutes: number;
  description: string;
  mode: 'Presencial' | 'Virtual';
  location: string;
  imageDataUrl?: string | null;
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
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [location, setLocation] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null | undefined>(undefined);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imagePreview = imageDataUrl === undefined
    ? serviceToEdit?.imageUrl || ''
    : imageDataUrl || '';

  const isEditing = Boolean(serviceToEdit);

  useEffect(() => {
    if (!isOpen) return;

    if (serviceToEdit) {
      setTitle(serviceToEdit.title);
      setPrice(String(serviceToEdit.price));
      setDuration(String(serviceToEdit.durationMinutes));
      setDescription(serviceToEdit.description || '');
      setMode(serviceToEdit.serviceMode || 'Presencial');
      setLocation(serviceToEdit.serviceLocation || '');
      setImageDataUrl(undefined);
    } else {
      setTitle('');
      setPrice('');
      setDuration('');
      setDescription('');
      setMode('Presencial');
      setLocation('');
      setImageDataUrl(null);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, serviceToEdit]);

  if (!isOpen) return null;

  const precioInterpretado = interpretarPrecio(price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isProcessingImage) {
      setError('Espera a que termine el procesamiento de la imagen.');
      return;
    }

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
    if (duracionNum < 5 || duracionNum > 480) {
      setError('La duración debe estar entre 5 y 480 minutos (8 horas).');
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

    if (mode === 'Presencial' && !location.trim()) {
      setError('Indica la ubicación del servicio presencial.');
      return;
    }

    const payload: ServicioFormData = {
      title: nombre,
      price: precioNum,
      durationMinutes: duracionNum,
      description: descripcion,
      mode,
      location: mode === 'Presencial' ? location.trim() : '',
      imageDataUrl,
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

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Elige una imagen JPG, PNG o WebP.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('La imagen debe pesar menos de 12 MB.');
      return;
    }

    setError(null);
    setIsProcessingImage(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      try {
        const context = canvas.getContext('2d');
        if (!context) throw new Error('No fue posible procesar esta imagen.');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      } finally {
        bitmap.close();
      }

      const compressedImage = canvas.toDataURL('image/webp', 0.82);
      if (compressedImage.length > 3_000_000) {
        throw new Error('La imagen sigue siendo demasiado pesada. Elige otra foto.');
      }
      setImageDataUrl(compressedImage);
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : 'No fue posible cargar la imagen.'
      );
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 border border-slate-200 shadow-2xl relative space-y-4">
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
                ? 'Actualiza los datos y la foto de este servicio.'
                : 'Añade un nuevo servicio disponible para reserva por tus clientes.'}
            </p>
          </div>
        </div>

        {/* noValidate: los mensajes se muestran dentro del formulario, en español. */}
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre del servicio</label>
            <input
              type="text"
              maxLength={100}
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
                type="text"
                inputMode="decimal"
                maxLength={16}
                placeholder="Ej: 35000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <p className="mt-1 text-[10px] text-slate-500">
                {price.trim() && precioInterpretado !== null && precioInterpretado > 0
                  ? `Se guardará como ${formatearCOP(precioInterpretado)}`
                  : 'Puedes usar puntos de miles y hasta 2 decimales.'}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Duración (minutos)</label>
              <input
                type="number"
                inputMode="numeric"
                min="5"
                max="480"
                step="1"
                placeholder="Ej: 45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {Number(duration) > 60 && (
                <p className="mt-1 text-[10px] font-semibold text-blue-700">
                  Se mostrará como {formatDuration(Number(duration))}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="service-mode" className="mb-1 block font-bold text-slate-700">Modalidad</label>
              <select
                id="service-mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as 'Presencial' | 'Virtual')}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual</option>
              </select>
            </div>
            {mode === 'Presencial' && (
              <div>
                <label htmlFor="service-location" className="mb-1 block font-bold text-slate-700">Ubicación</label>
                <input
                  id="service-location"
                  type="text"
                  required={mode === 'Presencial'}
                  maxLength={180}
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Dirección o lugar de atención"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}
          </div>
          {mode === 'Virtual' && (
            <p className="rounded-lg bg-indigo-50 px-3 py-2 text-[10px] text-indigo-700">
              El servicio se ofrecerá virtualmente. Puedes compartir el enlace de la sesión con el cliente al coordinar la cita.
            </p>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Descripción detallada</label>
            <textarea
              rows={2}
              maxLength={255}
              placeholder="Explica qué incluye el servicio y los beneficios para el cliente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            ></textarea>
          </div>

          <div>
            <label className="mb-1 block font-bold text-slate-700">Foto del servicio <span className="font-normal text-slate-400">(opcional)</span></label>
            <div className="flex items-center gap-3">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-[#eaf2ff]">
                {imagePreview ? (
                  <img src={imagePreview} alt="Vista previa del servicio" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <ImagePlus className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="service-image-upload"
                />
                <label
                  htmlFor="service-image-upload"
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 ${isProcessingImage ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <ImagePlus className="h-3.5 w-3.5 text-blue-600" />
                  {isProcessingImage ? 'Procesando...' : imagePreview ? 'Cambiar foto' : 'Subir foto'}
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => setImageDataUrl(null)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                )}
                <span className="w-full text-[10px] text-slate-400">JPG, PNG o WebP · máximo 12 MB</span>
              </div>
            </div>
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
              disabled={isSubmitting || isProcessingImage}
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
