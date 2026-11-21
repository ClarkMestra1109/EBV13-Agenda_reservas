import React, { useEffect, useState } from 'react';
import { UserRole } from '../../types';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
  Scissors,
  Music2,
  Dumbbell,
  Camera,
  BriefcaseBusiness,
  Briefcase,
} from 'lucide-react';
import { validarContrasena, validarCorreo, validarNombrePersona } from '../../utils/validation';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  onForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onRegister,
  onForgotPassword,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('provider');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  // Si el servidor estaba inactivo tarda en responder: tras unos segundos se explica la espera.
  useEffect(() => {
    if (!isSubmitting) {
      setIsSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setIsSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [isSubmitting]);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación previa con mensajes claros; el backend vuelve a validar todo.
    const problema = isRegistering
      ? validarNombrePersona(name) || validarCorreo(email) || validarContrasena(password)
      : validarCorreo(email) || (password ? null : 'La contraseña es obligatoria.');
    if (problema) {
      setError(problema);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await onRegister(name.trim(), email.trim(), password, selectedRole);
      } else {
        await onLogin(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible completar la operación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRegister = () => {
    setIsRegistering((prev) => !prev);
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#f8faff] flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Top Bar */}
      <header className="border-b border-[#e5eaf2] bg-white px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <span className="material-symbols-outlined text-2xl">event_upcoming</span>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#0b1c30] font-display">
              AgendaPro
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          {isRegistering ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}{' '}
          <button
            type="button"
            onClick={toggleRegister}
            className="text-blue-700 font-bold hover:underline"
          >
            {isRegistering ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-6 lg:px-10 py-8 my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Left Col: Hero Welcome */}
        <div className="lg:col-span-7 rounded-3xl bg-[#223f99] p-8 sm:p-10 text-white shadow-xl shadow-blue-950/20 flex flex-col justify-between min-h-[500px] lg:min-h-[560px]">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-blue-300/30 bg-blue-400/15 px-4 py-1.5 text-xs font-bold tracking-wide text-blue-100">
              PLATAFORMA INTEGRAL • REGISTRO
            </span>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.12] font-display">
              Organiza tus servicios.
              <br />
              <span className="text-blue-300">Reserva tu tiempo.</span>
            </h1>

            <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed max-w-xl">
              AgendaPro facilita la gestión integral de citas, disponibilidad y catálogo de
              servicios para profesionales independientes y empresas en cualquier industria.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="mb-3 text-xs font-extrabold tracking-wide text-blue-100">
                ADAPTABLE A MÚLTIPLES SECTORES:
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                  <Scissors className="h-3.5 w-3.5 text-amber-300" /> Barbería &amp; Belleza
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                  <Music2 className="h-3.5 w-3.5 text-fuchsia-300" /> Clases &amp; Educación
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                  <Dumbbell className="h-3.5 w-3.5 text-blue-200" /> Entrenamiento Personal
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                  <Camera className="h-3.5 w-3.5 text-cyan-200" /> Sesiones de Fotografía
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
                  <BriefcaseBusiness className="h-3.5 w-3.5 text-indigo-200" /> Soporte &amp; Consultoría
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-400/25 text-blue-100">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">¿Te registras como Proveedor?</h3>
                <p className="mt-1 text-xs leading-relaxed text-blue-100/85">
                  Tendrás acceso inmediato a tu Dashboard, catálogo de servicios, control de
                  disponibilidad con franjas y la agenda semanal sincronizada.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Login Form Card */}
        <div className="lg:col-span-5">
          <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">
                {isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa tus credenciales para continuar al panel de control.
              </p>
            </div>

            {/* Role indicator tab */}
            <div className="mb-5 p-1 bg-slate-100 rounded-xl flex items-center">
              <button
                type="button"
                onClick={() => handleSelectRole('provider')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedRole === 'provider'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Proveedor
              </button>
              <button
                type="button"
                onClick={() => handleSelectRole('client')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedRole === 'client'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cliente
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-name-input"
                      type="text"
                      maxLength={100}
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email-input"
                    type="email"
                    maxLength={150}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                    placeholder="ejemplo@agendapro.co"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Contraseña
                  </label>
                  {!isRegistering && (
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-[11px] font-semibold text-blue-700 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    maxLength={isRegistering ? 72 : 200}
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                    placeholder={
                      isRegistering ? 'Mínimo 8 caracteres, con letras y números' : 'Tu contraseña'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isRegistering && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Recordar sesión en este equipo</span>
                  </label>
                </div>
              )}

              {error && (
                <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700">
                  {error}
                </div>
              )}

              <button
                id="login-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 transition-all"
              >
                <span>
                  {isSubmitting
                    ? isSlow
                      ? 'Conectando con el servidor...'
                      : 'Procesando...'
                    : isRegistering
                    ? 'Crear cuenta'
                    : 'Iniciar sesión'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {isSlow && (
                <p role="status" className="text-[11px] text-slate-500 text-center leading-relaxed">
                  El servidor se está activando después de un tiempo sin uso. Puede tardar hasta un
                  minuto; no cierres la página.
                </p>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5eaf2] bg-white py-4 px-6 text-center text-xs text-slate-400">
        © 2026 AgendaPro Inc. • Plataforma de gestión de reservas, citas y servicios para profesionales y clientes.
      </footer>
    </div>
  );
};
