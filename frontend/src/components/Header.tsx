import React, { useState } from 'react';
import { UserRole, CurrentView } from '../types';
import {
  Search,
  Calendar,
  Plus,
  Bell,
  Check,
  Briefcase,
  Clock,
  Ban,
  ArrowLeftRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  role: UserRole;
  userName: string;
  currentView: CurrentView;
  onNavigate: (view: CurrentView) => void;
  onSwitchRole: () => void;
  onOpenNewService: () => void;
  onOpenNewSlot: () => void;
  onOpenShareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  userName,
  currentView,
  onNavigate,
  onSwitchRole,
  onOpenNewService,
  onOpenNewSlot,
  onOpenShareModal,
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header
      id="app-header"
      className="bg-white/95 backdrop-blur-md border-b border-[#e5eaf2] h-16 px-6 flex items-center justify-between sticky top-0 z-20"
    >
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              role === 'provider'
                ? 'Buscar servicio, cliente o fecha...'
                : 'Buscar servicio, categoría o profesional...'
            }
            className="w-full pl-9 pr-12 py-1.5 bg-[#f5f7fc] border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>Miércoles, 24 Octubre 2024</span>
        </div>

        {/* Share Public Link Button (Provider mode) */}
        {role === 'provider' && (
          <button
            onClick={onOpenShareModal}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100/70 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Enlace de Reserva</span>
          </button>
        )}

        {/* Quick Action Dropdown for Provider */}
        {role === 'provider' && (
          <div className="relative">
            <button
              id="header-action-button"
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Acción</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
            </button>

            {showActionMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                <button
                  onClick={() => {
                    setShowActionMenu(false);
                    onOpenNewService();
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-700 rounded-lg transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Nuevo servicio</span>
                </button>
                <button
                  onClick={() => {
                    setShowActionMenu(false);
                    onOpenNewSlot();
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-700 rounded-lg transition-colors"
                >
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Publicar horario libre</span>
                </button>
                <button
                  onClick={() => {
                    setShowActionMenu(false);
                    onNavigate('provider-agenda');
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-amber-700 rounded-lg transition-colors"
                >
                  <Ban className="w-4 h-4 text-amber-500" />
                  <span>Bloquear franja en agenda</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Role Toggle Switcher */}
        <button
          id="header-switch-role"
          onClick={onSwitchRole}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
            role === 'provider'
              ? 'bg-indigo-50/70 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
          }`}
          title="Alternar entre modo Proveedor y modo Cliente"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {role === 'provider' ? 'Ver como Cliente' : 'Ver como Proveedor'}
          </span>
          <span className="sm:hidden">{role === 'provider' ? 'Cliente' : 'Proveedor'}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Notificaciones Recientes</span>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  3 nuevas
                </span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-blue-50/50 rounded-xl text-left text-xs border border-blue-100/50">
                  <p className="font-semibold text-slate-800">Nueva reserva solicitada</p>
                  <p className="text-[11px] text-slate-500">Carlos Gómez ha solicitado Corte de Barbería para hoy 10:00 AM.</p>
                  <span className="text-[10px] text-blue-700 font-medium mt-1 inline-block">Hace 12 min</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl text-left text-xs border border-slate-100">
                  <p className="font-semibold text-slate-800">Recordatorio automático enviado</p>
                  <p className="text-[11px] text-slate-500">Notificación SMS enviada a Mariana Restrepo (Meet 02:30 PM).</p>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">Hace 1 hora</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar with status */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-[11px] font-extrabold ring-2 ring-blue-100">
              {userName ? userName.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="hidden md:block text-left leading-tight">
            <p className="text-xs font-bold text-slate-800">{userName}</p>
            <p className="text-[10px] font-semibold text-blue-700">
              {role === 'provider' ? 'Proveedor' : 'Cliente'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
