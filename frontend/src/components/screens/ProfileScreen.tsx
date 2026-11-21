import React, { useEffect, useState } from 'react';
import { ApiUser, PerfilPayload } from '../../services/api';
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
  validarContrasena,
  validarCorreo,
  validarNombrePersona,
  validarTelefono,
} from '../../utils/validation';

interface ProfileScreenProps {
  user: ApiUser;
  onSave: (data: PerfilPayload) => Promise<void>;
  onChangePassword: (data: {
    contrasenaActual: string;
    nuevaContrasena: string;
    confirmarContrasena: string;
  }) => Promise<void>;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600';

/** Acepta "minegocio.co" y le agrega https:// para guardarlo como enlace válido. */
const normalizarSitioWeb = (valor: string) => {
  const limpio = valor.trim();
  if (!limpio) return '';
  return /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
};

const validarSitioWeb = (valor: string): string | null => {
  const url = normalizarSitioWeb(valor);
  if (!url) return null;
  if (url.length > 200 || !/^https?:\/\/[^\s/$.?#][^\s]*\.[^\s]{2,}/i.test(url)) {
    return 'El sitio web debe ser un enlace válido, por ejemplo https://minegocio.co o instagram.com/minegocio.';
  }
  return null;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onSave, onChangePassword }) => {
  const [nombre, setNombre] = useState(user.nombre);
  const [correo, setCorreo] = useState(user.correo);
  const [telefono, setTelefono] = useState(user.telefono || '');
  const [nombreComercial, setNombreComercial] = useState(user.nombreComercial || '');
  const [sectorActividad, setSectorActividad] = useState(user.sectorActividad || '');
  const [descripcionComercial, setDescripcionComercial] = useState(user.descripcionComercial || '');
  const [sitioWeb, setSitioWeb] = useState(user.sitioWeb || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Cambio de contraseña: formulario aparte, con su propio botón y mensajes.
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const resetFromUser = () => {
    setNombre(user.nombre);
    setCorreo(user.correo);
    setTelefono(user.telefono || '');
    setNombreComercial(user.nombreComercial || '');
    setSectorActividad(user.sectorActividad || '');
    setDescripcionComercial(user.descripcionComercial || '');
    setSitioWeb(user.sitioWeb || '');
  };

  useEffect(() => {
    resetFromUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isProvider = user.rol === 'PROVEEDOR';

  const handleCancel = () => {
    resetFromUser();
    setError(null);
    setSuccess(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!actual || !nueva || !confirmar) {
      setPasswordError('Completa la contraseña actual, la nueva y su confirmación.');
      return;
    }
    const problema = validarContrasena(nueva);
    if (problema) {
      setPasswordError(problema);
      return;
    }
    if (nueva !== confirmar) {
      setPasswordError('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    if (nueva === actual) {
      setPasswordError('La nueva contraseña debe ser diferente de la actual.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await onChangePassword({ contrasenaActual: actual, nuevaContrasena: nueva, confirmarContrasena: confirmar });
      setActual('');
      setNueva('');
      setConfirmar('');
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'No fue posible cambiar la contraseña.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const problema =
      validarNombrePersona(nombre) ||
      validarCorreo(correo) ||
      validarTelefono(telefono) ||
      (isProvider ? validarSitioWeb(sitioWeb) : null);
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
        ...(isProvider
          ? {
              nombreComercial: nombreComercial.trim(),
              sectorActividad: sectorActividad.trim(),
              descripcionComercial: descripcionComercial.trim(),
              sitioWeb: normalizarSitioWeb(sitioWeb),
            }
          : {}),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar el perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  Es opcional. Tus clientes lo ven al reservar tus servicios.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    Nombre comercial
                  </label>
                  <input
                    maxLength={100}
                    value={nombreComercial}
                    onChange={(event) => setNombreComercial(event.target.value)}
                    placeholder="Nombre de tu negocio"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-bold text-slate-700">Sector o actividad</label>
                  <input
                    maxLength={80}
                    value={sectorActividad}
                    onChange={(event) => setSectorActividad(event.target.value)}
                    placeholder="Ej. Belleza, educación, consultoría"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-700">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    Descripción comercial
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={descripcionComercial}
                    onChange={(event) => setDescripcionComercial(event.target.value)}
                    placeholder="Describe brevemente los servicios de tu negocio"
                    className={`${inputClass} resize-none`}
                  />
                  <p className="mt-0.5 text-right text-[10px] text-slate-400">{descripcionComercial.length}/500</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-700">
                    <Globe2 className="h-3.5 w-3.5 text-slate-400" />
                    Sitio web o enlace comercial
                  </label>
                  <input
                    type="text"
                    inputMode="url"
                    maxLength={200}
                    value={sitioWeb}
                    onChange={(event) => setSitioWeb(event.target.value)}
                    placeholder="https://minegocio.co"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>
          )}

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
              {error}
            </div>
          )}

          {success && !error && (
            <div role="status" className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Perfil actualizado con éxito.</span>
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

        <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4 border-t border-slate-100 pt-5 text-xs">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <LockKeyhole className="h-4 w-4 text-blue-700" />
              Seguridad y contraseña
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Para cambiarla necesitas tu contraseña actual. La nueva debe tener entre 8 y 72
              caracteres, con letras y números.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="perfil-actual" className="mb-1.5 block font-bold text-slate-700">Contraseña actual</label>
              <input
                id="perfil-actual"
                type="password"
                autoComplete="current-password"
                maxLength={200}
                value={actual}
                onChange={(event) => setActual(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="perfil-nueva" className="mb-1.5 block font-bold text-slate-700">Nueva contraseña</label>
              <input
                id="perfil-nueva"
                type="password"
                autoComplete="new-password"
                maxLength={72}
                value={nueva}
                onChange={(event) => setNueva(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="perfil-confirmar" className="mb-1.5 block font-bold text-slate-700">Confirmar contraseña</label>
              <input
                id="perfil-confirmar"
                type="password"
                autoComplete="new-password"
                maxLength={72}
                value={confirmar}
                onChange={(event) => setConfirmar(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {passwordError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] text-red-700">
              {passwordError}
            </div>
          )}
          {passwordSuccess && !passwordError && (
            <div role="status" className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Contraseña actualizada con éxito.</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 font-bold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60"
            >
              <LockKeyhole className="h-4 w-4" />
              <span>{isChangingPassword ? 'Cambiando...' : 'Cambiar contraseña'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
