
import React, { useState, useMemo, useEffect } from 'react';
import { BriefcaseMedical, Search, Plus, Clock, Filter, Edit2, Trash2, CheckCircle2, XCircle, DollarSign, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Service } from '../types';
import { ServiceModal } from '../components/ServiceModal';
import { api } from '../services/api';
import { TableRowSkeleton, CardSkeleton } from '../components/Skeleton';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    // Fix: calling getServices with 0 arguments as defined in api.ts
    const data = await api.getServices();
    setServices(data);
    setLoading(false);
  };

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || service.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, categoryFilter]);

  const categories = Array.from(new Set(services.map(s => s.category)));

  const handleSaveService = async (service: Service) => {
    if (editingService) {
      const success = await api.updateService(service);
      if (success) {
        setServices(prev => prev.map(s => s.id === service.id ? service : s));
        toast.success("Servicio actualizado correctamente");
      } else {
        toast.error("Error actualizando servicio");
      }
    } else {
      const { id, ...newServiceData } = service; 
      const created = await api.createService(newServiceData);
      if (created) {
        setServices(prev => [...prev, created]);
        toast.success("Servicio creado correctamente");
      } else {
        toast.error("Error creando servicio");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      const success = await api.deleteService(id);
      if (success) {
        setServices(prev => prev.filter(s => s.id !== id));
        toast.success("Servicio eliminado");
      } else {
        toast.error("Error al eliminar el servicio");
      }
    }
  };

  const openCreateModal = () => {
    setEditingService(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BriefcaseMedical className="text-indigo-600" />
            Catálogo de Servicios
          </h1>
          <p className="text-slate-500 mt-1">Administra los servicios, precios y duraciones de tu negocio.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors font-medium shadow-sm shadow-indigo-200"
        >
          <Plus size={18} />
          Nuevo Servicio
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {loading ? (
            <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </>
        ) : (
            <>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><BriefcaseMedical size={24}/></div>
                <div>
                    <p className="text-sm text-slate-500 font-medium uppercase">Total Servicios</p>
                    <p className="text-2xl font-bold text-slate-800">{services.length}</p>
                </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={24}/></div>
                <div>
                    <p className="text-sm text-slate-500 font-medium uppercase">Activos</p>
                    <p className="text-2xl font-bold text-slate-800">{services.filter(s => s.status === 'ACTIVE').length}</p>
                </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Tag size={24}/></div>
                <div>
                    <p className="text-sm text-slate-500 font-medium uppercase">Categorías</p>
                    <p className="text-2xl font-bold text-slate-800">{categories.length}</p>
                </div>
                </div>
            </>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar servicio..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative w-full md:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select 
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Todas las Categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
            <div className="p-6">
                {[1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} />)}
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Servicio</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Duración</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredServices.map((service) => (
                    <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{service.name}</div>
                        {service.description && (
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{service.description}</div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock size={16} className="text-slate-400" />
                        <span className="font-medium">{service.duration} min</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm font-bold text-slate-800">
                            <DollarSign size={14} className="text-slate-400" />
                            {service.price.toFixed(2)}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {service.category}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {service.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                            <CheckCircle2 size={12} /> Activo
                        </span>
                        ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                            <XCircle size={12} /> Inactivo
                        </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => openEditModal(service)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => handleDelete(service.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                        >
                            <Trash2 size={18} />
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                {filteredServices.length === 0 && (
                    <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No se encontraron servicios que coincidan con la búsqueda.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        )}
      </div>

      <ServiceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveService}
        initialData={editingService}
      />
    </div>
  );
};
