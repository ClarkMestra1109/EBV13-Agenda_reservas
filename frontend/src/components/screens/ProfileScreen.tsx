import React, { useEffect, useState } from 'react';
import { ApiUser } from '../../services/api';
import {
  Building2,
  FileText,
  Globe2,
  LockKeyhole,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Store,
  UserCircle,
  X,
} from 'lucide-react';
import {
  normalizarTelefono,
  validarCorreo,
  validarNombrePersona,
  validarTelefono,
} from '../../utils/validation';

interface ProfileScreenProps {
  user: ApiUser;
  onSave: (data: { nombre: string; correo: string; telefono: string }) => Promise<void>;
}

const disabledInputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs text-slate-500 cursor-not-allowed';

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

  const handleCancel = () => {
    setNombre(user.nombre);
    setCorreo(user.correo);
    setTelefono(user.telefono || '');
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const problema =
      validarNombrePersona(nombre) || validarCorreo(correo) || validarTelefono(telefono);
    if (problema) {
      setError(problema);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        nombre: nombre.trim(),
        correo: correo.trim(),
        telefono: normalizarTelefono(telefono),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar el perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isProvider = user.rol === 'PROVEEDOR';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#0b1c30]">
          Mi perfil
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Administra tu información personal{isProvider ? ' y comercial' : ''}.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-lg font-extrabold text-white">
            {user.nombre ? user.nombre.charAt(0).toUpperCase() : <UserCircle className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900">{user.nombre}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
              {isProvider ? 'Cuenta de proveedor' : 'Cuenta de cliente'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6 text-xs">
          <section className="space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900">Información personal</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">Nombre completo</label>
                <input
                  type="text"
                  maxLength={100}
                  autoComplete="name"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  <span>Correo electrónico</span>
                </label>
                <input
                  type="email"
                  maxLength={150}
                  autoComplete="email"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                  <span>Teléfono</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  maxLength={20}
                  autoComplete="tel"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  placeholder="Ej. 3001234567"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </section>

          {isProvider && (
            <section className="space-y-4 border-t border-slate-100 pt-5">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <Store className="h-4 w-4 text-blue-700" />
                  Información comercial
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Personaliza cómo se presenta tu negocio a los clientes.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    Nombre comercial
                  </label>
                  <input disabled placeholder="Nombre de tu negocio" className={disabledInputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block font-bold text-slate-700">Sector o actividad</label>
                  <input disabled placeholder="Ej. Belleza, educación, consultoría" className={disabledInputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-700">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    Descripción comercial
                  </label>
                  <textarea
                    disabled
                    rows={3}
                    placeholder="Describe brevemente los servicios de tu negocio"
                    className={`${disabledInputClass} resize-none`}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-700">
                    <Globe2 className="h-3.5 w-3.5 text-slate-400" />
                    Sitio web o enlace comercial
                  </label>
                  <input disabled type="url" placeholder="https://" className={disabledInputClass} />
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4 border-t border-slate-100 pt-5">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <LockKeyhole className="h-4 w-4 text-blue-700" />
                Seguridad y contraseña
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">
                El cambio de contraseña estará disponible cuando el backend habilite esta función.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block font-bold text-slate-700">Contraseña actual</label>
                <input disabled type="password" autoComplete="current-password" className={disabledInputClass} />
              </div>
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">Nueva contraseña</label>
                <input disabled type="password" autoComplete="new-password" className={disabledInputClass} />
              </div>
              <div>
                <label className="mb-1.5 block font-bold text-slate-700">Confirmar contraseña</label>
                <input disabled type="password" autoComplete="new-password" className={disabledInputClass} />
              </div>
            </div>
          </section>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
              {error}
            </div>
          )}

          {success && !error && (
            <div role="status" className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Información personal actualizada con éxito.</span>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-5 py-2.5 font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-5 py-2.5 font-bold text-white shadow-xs transition-all hover:bg-blue-800 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Guardar cambios'}</span>
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
          Por ahora se guardan en el backend el nombre, correo y teléfono. Los campos de contraseña
          {isProvider ? ' e información comercial' : ''} estarán disponibles al integrar el soporte correspondiente.
        </div>
      </div>
    </div>
  );
};
