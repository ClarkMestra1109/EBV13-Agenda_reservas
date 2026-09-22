import React from 'react';
import { UserRole, CurrentView } from '../types';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
  Clock,
  Briefcase,
  Compass,
  BookmarkCheck,
  LogOut,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  userName: string;
  userEmail: string;
  currentView: CurrentView;
  onNavigate: (view: CurrentView) => void;
  onSwitchRole: () => void;
  onLogout: () => void;
  pendingBookingsCount: number;
  activeClientBookingsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  userName,
  userEmail,
  currentView,
  onNavigate,
  onSwitchRole,
  onLogout,
  pendingBookingsCount,
  activeClientBookingsCount,
}) => {
  return (
    <aside
      id="app-sidebar"
      className="w-64 bg-[#f8faff] border-r border-[#e3e8f4] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-30"
    >
      {/* Brand Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <span className="material-symbols-outlined text-2xl">event_upcoming</span>
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight text-[#0b1c30] leading-tight flex items-center gap-1.5 font-display">
              AgendaPro
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              {role === 'provider' ? 'Panel Operativo' : 'Portal de Clientes'}
            </p>
          </div>
        </div>

        {/* Usuario autenticado */}
        <div className="mt-5 p-2 bg-blue-50/80 rounded-xl border border-blue-100 flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${role === 'provider' ? 'bg-indigo-600' : 'bg-emerald-600'}`}></span>
          <span className="text-xs font-bold text-slate-700 truncate">{userName}</span>
        </div>

        {/* Navigation Section */}
        <nav className="mt-6 space-y-1">
          {role === 'provider' ? (
            <>
              <button
                id="nav-provider-dashboard"
                onClick={() => onNavigate('provider-dashboard')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'provider-dashboard'
                    ? 'bg-blue-700 text-white font-semibold shadow-sm shadow-blue-700/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
              </button>

              <button
                id="nav-provider-services"
                onClick={() => onNavigate('provider-services')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'provider-services'
                    ? 'bg-blue-700 text-white font-semibold shadow-sm shadow-blue-700/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4" />
                  <span>Mis servicios</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  currentView === 'provider-services' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  6
                </span>
              </button>

              <button
                id="nav-provider-availability"
                onClick={() => onNavigate('provider-availability')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'provider-availability'
                    ? 'bg-blue-700 text-white font-semibold shadow-sm shadow-blue-700/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4" />
                  <span>Disponibilidad</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  currentView === 'provider-availability' ? 'bg-blue-800 text-blue-100' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  18 libres
                </span>
              </button>

              <button
                id="nav-provider-reservations"
                onClick={() => onNavigate('provider-reservations')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'provider-reservations'
                    ? 'bg-blue-700 text-white font-semibold shadow-sm shadow-blue-700/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck2 className="w-4 h-4" />
                  <span>Reservas</span>
                </div>
                {pendingBookingsCount > 0 && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    currentView === 'provider-reservations' ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {pendingBookingsCount}
                  </span>
                )}
              </button>

              <button
                id="nav-provider-agenda"
                onClick={() => onNavigate('provider-agenda')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'provider-agenda'
                    ? 'bg-blue-700 text-white font-semibold shadow-sm shadow-blue-700/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4" />
                  <span>Mi agenda</span>
                </div>
              </button>
            </>
          ) : (
            <>
              <button
                id="nav-client-dashboard"
                onClick={() => onNavigate('client-dashboard')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'client-dashboard'
                    ? 'bg-blue-700 text-white font-semibold shadow-sm shadow-blue-700/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Inicio</span>
                </div>
              </button>

              <button
                id="nav-client-explore"
                onClick={() => onNavigate('client-explore')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'client-explore'
                    ? 'bg-blue-700 text-white font-semibold shadow-sm shadow-blue-700/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-4 h-4" />
                  <span>Explorar servicios</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                  Nuevo
                </span>
              </button>

              <button
                id="nav-client-reservations"
                onClick={() => onNavigate('client-reservations')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentView === 'client-reservations'
                    ? 'bg-blue-700 text-white font-semibold shadow-sm shadow-blue-700/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Mis reservas</span>
                </div>
                {activeClientBookingsCount > 0 && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    currentView === 'client-reservations' ? 'bg-white text-blue-900' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {activeClientBookingsCount}
                  </span>
                )}
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Footer Info & User Profile */}
      <div className="p-4 border-t border-[#e3e8f4] space-y-3 bg-[#f3f6fc]/50">
        {role === 'provider' ? (
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded-md">
                PLAN PROFESIONAL
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sincronizado
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 mt-1.5 truncate">
              {userName}
            </p>
            <p className="text-[11px] text-slate-500">
              Datos sincronizados con el backend
            </p>
          </div>
        ) : (
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Soporte VIP 24/7</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Atención preferente y garantía en todas tus citas.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-[11px] font-extrabold border border-slate-200 shrink-0">
              {userName ? userName.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="text-left leading-tight min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Cerrar sesión / Ir a Login"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
