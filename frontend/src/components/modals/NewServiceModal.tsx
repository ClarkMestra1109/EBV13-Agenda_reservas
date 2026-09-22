import React, { useState } from 'react';
import { ServiceItem } from '../../types';
import { X, Briefcase, Plus } from 'lucide-react';

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddService: (service: ServiceItem) => void;
}

export const NewServiceModal: React.FC<NewServiceModalProps> = ({
  isOpen,
  onClose,
  onAddService,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Barbería & Belleza');
  const [price, setPrice] = useState('35000');
  const [duration, setDuration] = useState('45');
  const [modality, setModality] = useState('Presencial');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newSrv: ServiceItem = {
      id: `srv-${Date.now()}`,
      title,
      category,
      categorySlug: category.toLowerCase().includes('barber')
        ? 'barberia'
        : category.toLowerCase().includes('clase')
        ? 'clases'
        : 'general',
      providerName: 'Laura Morales',
      providerStudio: 'Laura Morales Studio • Bogotá Chicó Norte',
      modalityBadge: modality,
      price: parseInt(price) || 30000,
      durationMinutes: parseInt(duration) || 45,
      rating: 5.0,
      reviewsCount: 1,
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCOOA4gaFcqrI965s1tf5LyjFUANtEEFp4-KGEuqZHbsEGF_nu8UvauZ1kFm2Twj4Co7xIS9sT5gUAHOEEdAlesZ3EpZvZazr4Krh6O3dOv4PAwRtp6Eddz4eUvRJYnBseZVI7dY95Tv2tuVhinyvVQnRNWSFjP_LrNw030jAIjgfwkPn90fCPbLzvF8vALQEW9M--fYVksOXEtpcIONwzrn9TZDKaHn5WEaW3_DCH6FugcybBjHiYXRA',
      description: description || 'Servicio profesional con atención personalizada en Bogotá.',
      isActive: true,
    };

    onAddService(newSrv);
    onClose();
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
              Publicar Nuevo Servicio
            </h3>
            <p className="text-xs text-slate-500">
              Añade un nuevo servicio disponible para reserva por tus clientes.
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
              <label className="block font-bold text-slate-700 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Barbería & Belleza">Barbería & Belleza</option>
                <option value="Clases & Educación">Clases & Educación</option>
                <option value="Entrenamiento Personal">Entrenamiento Personal</option>
                <option value="Fotografía">Fotografía</option>
                <option value="Soporte Técnico">Soporte Técnico</option>
                <option value="Asesorías">Asesorías</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Modalidad</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Presencial">Presencial en local</option>
                <option value="Virtual">Virtual (Meet / Zoom)</option>
                <option value="A domicilio">A domicilio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tarifa (COP)</label>
              <input
                type="number"
                required
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
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar servicio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
