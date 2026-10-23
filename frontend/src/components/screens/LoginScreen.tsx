import React, { useState } from 'react';
import { UserRole } from '../../types';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRegister }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('provider');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await onRegister(name, email, password, selectedRole);
      } else {
        await onLogin(email, password);
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
      <main className="max-w-6xl w-full mx-auto px-6 py-10 my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Col: Hero Welcome */}
        <div className="lg:col-span-7 space-y-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0b1c30] tracking-tight leading-[1.15] font-display">
            Bienvenido de vuelta a tu espacio en{' '}
            <span className="text-blue-700">AgendaPro</span>.
          </h1>

          <p className="text-slate-600 text-base leading-relaxed max-w-xl">
            Accede con tu cuenta para gestionar tus servicios, revisar solicitudes pendientes
            y organizar tu agenda de manera eficiente y centralizada.
          </p>

          {/* Quick Profile Switcher Preview Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-lg">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Selecciona el rol de tu cuenta
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectRole('provider')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  selectedRole === 'provider'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold shrink-0 border border-slate-200">
                  P
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">Proveedor</div>
                  <div className="text-[11px] font-medium text-blue-700">Ofrece servicios</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Publica servicios y horarios
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole('client')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  selectedRole === 'client'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold shrink-0 border border-slate-200">
                  C
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">Cliente</div>
                  <div className="text-[11px] font-medium text-emerald-700">Reserva servicios</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Explora y reserva citas
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Flow Checkpoints */}
          <div className="pt-2 space-y-2.5 max-w-lg">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Validación de credenciales y roles en tiempo real</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Detección automática de panel según el rol de tu cuenta</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sincronización instantánea de citas, cupos y reservas</span>
            </div>
          </div>
        </div>

        {/* Right Col: Login Form Card */}
        <div className="lg:col-span-5">
          <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">
                Iniciar sesión
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

            <form onSubmit={handleSubmit} className="space-y-4">
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
                      required
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
                    required
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
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                    placeholder="Tu contraseña secreta"
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

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700">
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
                    ? 'Procesando...'
                    : isRegistering
                    ? 'Crear cuenta'
                    : 'Iniciar sesión'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
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
