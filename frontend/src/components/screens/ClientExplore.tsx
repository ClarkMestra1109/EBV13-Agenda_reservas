import React, { useState } from 'react';
import { ServiceItem, CurrentView } from '../../types';
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';

interface ClientExploreProps {
  services: ServiceItem[];
  onSelectServiceToBook: (service: ServiceItem) => void;
  onNavigate: (view: CurrentView) => void;
}

export const ClientExplore: React.FC<ClientExploreProps> = ({
  services,
  onSelectServiceToBook,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');

  const categories = [
    { id: 'all', label: 'Todos los servicios' },
  ];

  // Filtering
  const filteredServices = services
    .filter((s) => {
      if (selectedCategory !== 'all' && s.categorySlug !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesDesc = s.description.toLowerCase().includes(q);
        const matchesProvider = s.providerName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesProvider) return false;
      }
      if (selectedModality !== 'all') {
        if (selectedModality === 'presencial' && !s.modalityBadge.includes('Presencial')) return false;
        if (selectedModality === 'virtual' && !s.modalityBadge.includes('Virtual')) return false;
        if (selectedModality === 'domicilio' && !s.modalityBadge.includes('domicilio')) return false;
      }
      if (selectedPriceRange !== 'all') {
        if (selectedPriceRange === 'low' && s.price > 30000) return false;
        if (selectedPriceRange === 'mid' && (s.price <= 30000 || s.price > 60000)) return false;
        if (selectedPriceRange === 'high' && s.price <= 60000) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Hero Banner (Image 20) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-blue-950/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>CATÁLOGO VERIFICADO PARA CLIENTES PREFERENTES</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
              Explorar Servicios
            </h1>
            <p className="text-blue-200/80 text-xs sm:text-sm leading-relaxed">
              Encuentra y agenda citas con los mejores profesionales independientes y negocios locales verificados. Disponibilidad en tiempo real y confirmación inmediata.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
            <div>
              <div className="text-2xl font-extrabold font-display">140+</div>
              <div className="text-[11px] text-blue-200">Servicios activos</div>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div>
              <div className="text-2xl font-extrabold font-display">100%</div>
              <div className="text-[11px] text-blue-200">Reserva segura</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Image 20) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Bar (5 cols) */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, especialidad o proveedor..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>

          {/* Modalidad (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            >
              <option value="all">Modalidad no registrada en backend</option>
            </select>
          </div>

          {/* Rango de precio (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            >
              <option value="all">Cualquier precio</option>
              <option value="low">Menos de $30.000</option>
              <option value="mid">$30.000 - $60.000</option>
              <option value="high">Más de $60.000</option>
            </select>
          </div>

          {/* Ordenar por (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            >
              <option value="rating">Mejor calificados</option>
              <option value="price-low">Menor precio</option>
              <option value="price-high">Mayor precio</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid (Image 20) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Image Banner */}
              <div className="h-48 relative overflow-hidden">
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                    {service.modalityBadge}
                  </span>
                </div>
                <span className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-blue-900 text-xs font-black px-2.5 py-1 rounded-xl shadow-xs">
                  ${service.price.toLocaleString('es-CO')} COP
                </span>
              </div>

              {/* Content */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    {service.category}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-slate-800">{service.rating}</span>
                    <span className="text-slate-400 font-normal">({service.reviewsCount})</span>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-[#0b1c30] font-display line-clamp-1 group-hover:text-blue-700 transition-colors">
                  {service.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{service.durationMinutes} minutos</span>
                  </div>
                  <span className="font-medium text-slate-700 truncate max-w-[140px]">
                    {service.providerStudio}
                  </span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="p-5 pt-0">
              <button
                id={`book-service-${service.id}`}
                onClick={() => {
                  onSelectServiceToBook(service);
                  onNavigate('client-booking');
                }}
                className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Ver horarios disponibles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">No se encontraron servicios</p>
          <p className="text-xs text-slate-500">
            Intenta cambiar los filtros de categoría, precio o término de búsqueda.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setSelectedModality('all');
              setSelectedPriceRange('all');
            }}
            className="text-xs font-bold text-blue-700 underline"
          >
            Restablecer todos los filtros
          </button>
        </div>
      )}
    </div>
  );
};
