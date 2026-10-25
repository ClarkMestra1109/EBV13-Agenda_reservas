import React, { useEffect, useState } from 'react';
import { ApiUser } from '../../services/api';
import { UserCircle, Save, Mail, Phone, ShieldCheck } from 'lucide-react';

interface ProfileScreenProps {
  user: ApiUser;
  onSave: (data: { nombre: string; correo: string; telefono: string }) => Promise<void>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onSave }) => {
  const [nombre, setNombre] = useState(user.nombre);
  const [correo, setCorreo] = useState(user.correo);
  const [telefono, setTelefono] = useState(user.telefono || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setNombre(user.nombre);
    setCorreo(user.correo);
    setTelefono(user.telefono || '');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!nombre.trim() || !correo.trim()) {
      setError('El nombre y el correo son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ nombre: nombre.trim(), correo: correo.trim(), telefono: telefono.trim() });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar el perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">
          Mi perfil
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Actualiza tus datos personales. Estos cambios se guardan directamente en el backend.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center text-lg font-extrabold">
            {user.nombre ? user.nombre.charAt(0).toUpperCase() : <UserCircle className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900">{user.nombre}</p>
            <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              {user.rol === 'PROVEEDOR' ? 'Cuenta de proveedor' : 'Cuenta de cliente'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Nombre completo</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Correo electrónico</span>
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Teléfono (opcional)</span>
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej. 3001234567"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700">
              {error}
            </div>
          )}

          {success && !error && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Perfil actualizado con éxito.</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white rounded-xl font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
