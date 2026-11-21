import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Boxes,
  CalendarDays,
  Edit2,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { ServiceItem } from '../../types';
import {
  ApiDisponibilidadRecurso,
  ApiRecurso,
  RecursoPayload,
  TipoRecurso,
  asociarRecurso,
  createRecurso,
  deleteRecurso,
  desasociarRecurso,
  getDisponibilidadRecurso,
  getRecursos,
  updateRecurso,
} from '../../services/api';
import { hoyBogota } from '../../utils/validation';

interface ProviderResourcesProps {
  services: ServiceItem[];
  onNotify: (message: string, type?: 'ok' | 'error') => void;
}

const TIPOS: { value: TipoRecurso; label: string; ejemplo: string }[] = [
  { value: 'ESPACIO', label: 'Espacio', ejemplo: 'Sala, cabina, consultorio' },
  { value: 'EQUIPO', label: 'Equipo', ejemplo: 'Máquina, herramienta, vehículo' },
  { value: 'PERSONAL', label: 'Personal', ejemplo: 'Profesional que atiende' },
  { value: 'OTRO', label: 'Otro', ejemplo: 'Cualquier otro elemento' },
];

const tipoLabel = (tipo: TipoRecurso) => TIPOS.find((t) => t.value === tipo)?.label || tipo;

const horaBogota = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  }).format(new Date(iso));

const inputClass =
  'w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600';

// ------------------------------------------------------------------ formulario (HU07 / HU09)

interface ResourceFormProps {
  resource: ApiRecurso | null;
  onClose: () => void;
  onSave: (data: RecursoPayload) => Promise<void>;
}

const ResourceForm: React.FC<ResourceFormProps> = ({ resource, onClose, onSave }) => {
  const [nombre, setNombre] = useState(resource?.nombre || '');
  const [tipo, setTipo] = useState<TipoRecurso | ''>(resource?.tipo || '');
  const [capacidad, setCapacidad] = useState(resource ? String(resource.capacidad) : '');
  const [descripcion, setDescripcion] = useState(resource?.descripcion || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // HU07: se indican todos los campos que faltan, no solo el primero.
    const faltantes: string[] = [];
    if (!nombre.trim()) faltantes.push('nombre');
    if (!tipo) faltantes.push('tipo');
    if (!capacidad.trim()) faltantes.push('capacidad');
    if (faltantes.length) {
      setError(`Completa los campos obligatorios: ${faltantes.join(', ')}.`);
      return;
    }
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 2 || !/[\p{L}\d]/u.test(nombreLimpio)) {
      setError('El nombre del recurso debe tener al menos 2 caracteres e incluir letras o números.');
      return;
    }
    const cupos = Number(capacidad);
    if (!Number.isInteger(cupos) || cupos < 1 || cupos > 1000) {
      setError('La capacidad debe ser un número entero entre 1 y 1000.');
      return;
    }
    if (descripcion.trim().length > 255) {
      setError('La descripción no puede superar 255 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        nombre: nombreLimpio,
        tipo: tipo as TipoRecurso,
        capacidad: cupos,
        descripcion: descripcion.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar el recurso.');
    } finally {
      setIsSubmitting(false);
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
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-display">
              {resource ? 'Editar recurso' : 'Registrar recurso'}
            </h3>
            <p className="text-xs text-slate-500">
              Lo que necesitas para prestar tus servicios: un espacio, un equipo o una persona.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="recurso-nombre" className="block font-bold text-slate-700 mb-1">
              Nombre del recurso
            </label>
            <input
              id="recurso-nombre"
              type="text"
              maxLength={100}
              placeholder="Ej: Silla de barbería 1"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="recurso-tipo" className="block font-bold text-slate-700 mb-1">
                Tipo
              </label>
              <select
                id="recurso-tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoRecurso | '')}
                className={inputClass}
              >
                <option value="">Selecciona un tipo</option>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {tipo && (
                <p className="mt-1 text-[10px] text-slate-500">
                  {TIPOS.find((t) => t.value === tipo)?.ejemplo}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="recurso-capacidad" className="block font-bold text-slate-700 mb-1">
                Capacidad simultánea
              </label>
              <input
                id="recurso-capacidad"
                type="number"
                inputMode="numeric"
                min={1}
                max={1000}
                step={1}
                placeholder="Ej: 1"
                value={capacidad}
                onChange={(e) => setCapacidad(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-[10px] text-slate-500">
                Reservas que puede atender al mismo tiempo.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="recurso-descripcion" className="block font-bold text-slate-700 mb-1">
              Descripción <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="recurso-descripcion"
              rows={2}
              maxLength={255}
              placeholder="Detalles útiles: ubicación, características..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={inputClass}
            />
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
              {resource ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isSubmitting ? 'Guardando...' : resource ? 'Guardar cambios' : 'Registrar recurso'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ ocupación por día (HU09)

const ResourceAvailability: React.FC<{ resource: ApiRecurso }> = ({ resource }) => {
  const [fecha, setFecha] = useState(hoyBogota());
  const [data, setData] = useState<ApiDisponibilidadRecurso | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!fecha) return;
    let active = true;
    setIsLoading(true);
    setError(null);
    getDisponibilidadRecurso(resource.id, fecha)
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'No fue posible consultar la ocupación.'))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [fecha, resource.id, resource.capacidad, resource.reservasProximas]);

  return (
    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
          Ocupación por horario
        </p>
        <input
          type="date"
          aria-label={`Día a consultar para ${resource.nombre}`}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700"
        />
      </div>
      {error && <p className="text-[11px] text-red-700">{error}</p>}
      {!error && isLoading && <p className="text-[11px] text-slate-500">Consultando...</p>}
      {!error && !isLoading && data && data.horarios.length === 0 && (
        <p className="text-[11px] text-slate-500">
          No hay horarios publicados ese día en los servicios que usan este recurso.
        </p>
      )}
      {!error && !isLoading && data && data.horarios.length > 0 && (
        <ul className="space-y-1.5">
          {data.horarios.map((h) => {
            const lleno = h.cuposDisponibles === 0;
            return (
              <li
                key={h.franjaId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 text-[11px] border border-slate-100"
              >
                <span className="font-semibold text-slate-800">
                  {horaBogota(h.inicio)} – {horaBogota(h.fin)} · {h.servicio}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 font-bold ${
                    lleno ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {h.reservasSimultaneas} de {data.capacidad} ocupados ·{' '}
                  {lleno ? 'sin cupos' : `${h.cuposDisponibles} libre(s)`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ pantalla

export const ProviderResources: React.FC<ProviderResourcesProps> = ({ services, onNotify }) => {
  const [resources, setResources] = useState<ApiRecurso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ApiRecurso | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<Record<number, string>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setResources(await getRecursos());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No fue posible cargar los recursos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const replaceResource = (updated: ApiRecurso) =>
    setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const handleSave = async (data: RecursoPayload) => {
    if (editing) {
      const updated = await updateRecurso(editing.id, data);
      replaceResource(updated);
      onNotify(`Recurso "${updated.nombre}" actualizado.`);
    } else {
      const created = await createRecurso(data);
      setResources((prev) => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
      onNotify(`Recurso "${created.nombre}" registrado. Ya puedes asociarlo a tus servicios.`);
    }
  };

  const handleDelete = async (resource: ApiRecurso) => {
    setBusyId(resource.id);
    try {
      await deleteRecurso(resource.id);
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
      onNotify(`Recurso "${resource.nombre}" eliminado.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No fue posible eliminar el recurso.', 'error');
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleAssociate = async (resource: ApiRecurso) => {
    const serviceId = selectedService[resource.id];
    if (!serviceId) {
      onNotify('Selecciona el servicio al que quieres asociar el recurso.', 'error');
      return;
    }
    setBusyId(resource.id);
    try {
      const updated = await asociarRecurso(Number(serviceId), resource.id);
      replaceResource(updated);
      setSelectedService((prev) => ({ ...prev, [resource.id]: '' }));
      onNotify(`"${resource.nombre}" quedó asociado al servicio.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No fue posible asociar el recurso.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDissociate = async (resource: ApiRecurso, serviceId: number, serviceName: string) => {
    setBusyId(resource.id);
    try {
      await desasociarRecurso(serviceId, resource.id);
      replaceResource({ ...resource, servicios: resource.servicios.filter((s) => s.id !== serviceId) });
      onNotify(`"${resource.nombre}" ya no está asociado a "${serviceName}".`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'No fue posible quitar la asociación.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0b1c30] tracking-tight font-display">Recursos</h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Registra lo que necesitas para prestar tus servicios y cuántas reservas puede atender a la vez.
            Si un recurso se llena en un horario, el sistema no acepta más reservas en ese horario, aunque
            vengan de servicios distintos que lo comparten.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800"
          >
            <Plus className="w-4 h-4" />
            Nuevo recurso
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {!isLoading && !loadError && resources.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
          <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Aún no tienes recursos registrados</p>
          <p className="text-xs text-slate-500">
            Ejemplo: "Silla 1" de tipo Espacio con capacidad 1, asociada a "Corte" y "Barba".
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-800"
          >
            <Plus className="w-4 h-4" />
            Registrar el primero
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {resources.map((resource) => {
          const asociadosIds = new Set(resource.servicios.map((s) => s.id));
          const disponibles = services.filter((s) => !asociadosIds.has(Number(s.backendId ?? s.id)));
          const ocupacionPct = resource.capacidad > 0 ? (resource.ocupacionMaxima / resource.capacidad) * 100 : 0;
          const isBusy = busyId === resource.id;

          return (
            <article key={resource.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900 truncate">{resource.nombre}</h2>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      {tipoLabel(resource.tipo)}
                    </span>
                  </div>
                  {resource.descripcion && (
                    <p className="mt-1 text-[11px] text-slate-500">{resource.descripcion}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(resource);
                      setIsFormOpen(true);
                    }}
                    aria-label={`Editar ${resource.nombre}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(resource.id)}
                    aria-label={`Eliminar ${resource.nombre}`}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {confirmDeleteId === resource.id && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-800">
                  <span>¿Eliminar "{resource.nombre}"? Esta acción no se puede deshacer.</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="rounded-lg px-3 py-1.5 font-bold text-slate-600 hover:bg-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(resource)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

              {/* HU09: capacidad y ocupación */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] font-semibold text-slate-500">Capacidad</p>
                  <p className="text-lg font-extrabold text-slate-900">{resource.capacidad}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] font-semibold text-slate-500">Reservas próximas</p>
                  <p className="text-lg font-extrabold text-slate-900">{resource.reservasProximas}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] font-semibold text-slate-500">Libres en hora pico</p>
                  <p
                    className={`text-lg font-extrabold ${
                      resource.cuposLibresEnPico === 0 && resource.reservasProximas > 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {resource.cuposLibresEnPico}
                  </p>
                </div>
              </div>
              <div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ocupacionPct >= 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(100, ocupacionPct)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  En su momento más ocupado tiene {resource.ocupacionMaxima} de {resource.capacidad} cupos reservados.
                </p>
              </div>

              {/* HU08: asociaciones */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-blue-600" />
                  Servicios que usan este recurso
                </p>
                {resource.servicios.length === 0 ? (
                  <p className="text-[11px] text-slate-500">Todavía no está asociado a ningún servicio.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {resource.servicios.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white pl-2.5 pr-1 py-1 text-[11px] font-semibold text-slate-700"
                      >
                        {s.nombre}
                        {s.estado === 'INACTIVO' && <span className="text-slate-400 font-normal">(inactivo)</span>}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDissociate(resource, s.id, s.nombre)}
                          aria-label={`Quitar ${resource.nombre} de ${s.nombre}`}
                          className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {disponibles.length > 0 ? (
                  <div className="flex gap-2">
                    <select
                      aria-label={`Servicio para asociar a ${resource.nombre}`}
                      value={selectedService[resource.id] || ''}
                      onChange={(e) => setSelectedService((prev) => ({ ...prev, [resource.id]: e.target.value }))}
                      className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700"
                    >
                      <option value="">Asociar a un servicio...</option>
                      {disponibles.map((s) => (
                        <option key={s.id} value={String(s.backendId ?? s.id)}>
                          {s.title}
                          {s.isActive ? '' : ' (inactivo)'}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleAssociate(resource)}
                      className="shrink-0 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                    >
                      Asociar
                    </button>
                  </div>
                ) : (
                  services.length === 0 && (
                    <p className="text-[11px] text-slate-500">Crea un servicio para poder asociarle recursos.</p>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setExpandedId(expandedId === resource.id ? null : resource.id)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 hover:text-blue-900"
              >
                <Users className="w-3.5 h-3.5" />
                {expandedId === resource.id ? 'Ocultar ocupación por horario' : 'Ver ocupación por horario'}
              </button>
              {expandedId === resource.id && <ResourceAvailability resource={resource} />}
            </article>
          );
        })}
      </div>

      {isFormOpen && (
        <ResourceForm
          resource={editing}
          onClose={() => {
            setIsFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
