
import React, { useState, useMemo, useEffect } from 'react';
import { BriefcaseMedical, Search, Plus, Clock, Filter, Edit2, Trash2, CheckCircle2, XCircle, DollarSign, Tag, ImageIcon, LayoutGrid, List, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Service } from '../types';
import { ServiceModal } from '../components/ServiceModal';
import { api } from '../services/api';
import { TableRowSkeleton, CardSkeleton } from '../components/Skeleton';
import { exportToExcel, importFromExcel } from '../utils/excelUtils';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('GRID');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>(undefined);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
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
        toast.success("Nodo de servicio sincronizado");
      }
    } else {
      const { id, ...newServiceData } = service;
      const created = await api.createService(newServiceData);
      if (created) {
        setServices(prev => [...prev, created]);
        toast.success("Nuevo nodo de servicio integrado");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Confirmar desvinculación de servicio?')) {
      const success = await api.deleteService(id);
      if (success) {
        setServices(prev => prev.filter(s => s.id !== id));
        toast.success("Servicio eliminado del ecosistema");
      }
    }
  };

  const handleExport = async () => {
    toast.info("Generando ecosistema de exportación XLSX...");
    const data = await api.exportServices();
    if (data.length === 0) {
      toast.error("No hay servicios para exportar");
      return;
    }

    // Normalizar para Excel
    const excelData = data.map(s => ({
      Nombre: s.name,
      Categoría: s.category,
      Precio: s.price,
      Duración: s.duration,
      Estado: s.status,
      Descripción: s.description,
      ImagenURL: s.imageUrl
    }));

    exportToExcel(excelData, `servicios_${new Date().toISOString().split('T')[0]}`);
    toast.success("Catálogo exportado exitosamente");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Analizando matriz XLSX...");
      const data = await importFromExcel(file);

      // Mapear de vuelta a estructura de base de datos
      const mappedData = data.map((item: any) => ({
        name: item.Nombre || item.name,
        category: item.Categoría || item.category,
        price: item.Precio || item.price,
        duration: item.Duración || item.duration,
        status: item.Estado || item.status,
        description: item.Descripción || item.description,
        imageUrl: item.ImagenURL || item.imageUrl
      }));

      toast.info("Sincronizando catálogo importado...");
      const res = await api.importServices(mappedData);
      if (res.success) {
        toast.success(`${res.count} servicios integrados al ecosistema`);
        loadServices();
      } else {
        toast.error("Falla en la importación: " + res.error);
      }
    } catch (err) {
      toast.error("Error al procesar archivo Excel");
    }
    e.target.value = ''; // Reset input
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="bg-card-theme p-5 rounded-[2.5rem] border border-theme mb-10 flex flex-col md:flex-row gap-6 justify-between items-center">
        <div className="relative w-full md:w-[450px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text" placeholder="Filtrar por identidad de servicio..."
            className="w-full pl-14 pr-6 py-4 bg-input-theme border border-theme rounded-2xl text-main outline-none focus:border-[#D4AF37]/30 transition-all font-medium"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <select
            className="w-full md:w-64 px-6 py-4 bg-input-theme border border-theme rounded-2xl text-main text-[10px] font-black uppercase outline-none focus:border-[#D4AF37] cursor-pointer"
            value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Todas las Ramas</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex bg-input-theme p-1.5 rounded-2xl border border-theme">
            <button onClick={() => setViewMode('GRID')} title="Vista Cuadrícula" className={`p-2.5 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-zinc-500 hover:text-white'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('TABLE')} title="Vista Tabla" className={`p-2.5 rounded-xl transition-all ${viewMode === 'TABLE' ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-zinc-500 hover:text-white'}`}><List size={18} /></button>
          </div>

          <div className="flex bg-input-theme p-1.5 rounded-2xl border border-theme gap-1">
            <button onClick={handleExport} title="Exportar Servicios XLSX" className="p-2.5 rounded-xl text-slate-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all"><Download size={18} /></button>
            <label className="p-2.5 rounded-xl text-slate-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all cursor-pointer">
              <Upload size={18} />
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map(service => (
            <div key={service.id} className="glass-card rounded-[3rem] overflow-hidden border-white/5 group hover:border-[#D4AF37]/30 transition-all">
              <div className="h-48 relative overflow-hidden">
                <img src={service.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600'} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700" alt={service.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                <div className="absolute bottom-6 left-8 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-black text-[8px] uppercase tracking-widest">${service.price}</span>
                  <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-black text-[8px] uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {service.duration}m</span>
                </div>
              </div>
              <div className="p-10">
                <h3 className="text-2xl font-black text-main tracking-tighter uppercase mb-4">{service.name}</h3>
                <p className="text-muted text-xs leading-relaxed mb-10 line-clamp-2">{service.description || 'Sin descripción técnica registrada.'}</p>
                <div className="flex gap-3 pt-6 border-t border-theme">
                  <button onClick={() => { setEditingService(service); setIsModalOpen(true); }} className="flex-1 bg-card p-4 rounded-xl font-black text-[9px] uppercase tracking-widest text-muted hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all">Configurar</button>
                  <button onClick={() => handleDelete(service.id)} className="p-4 bg-card text-slate-500 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Identidad de Servicio</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Duración</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Inversión</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">Estatus</th>
                <th className="px-8 py-6 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredServices.map(service => (
                <tr key={service.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0">
                        <img src={service.imageUrl} className="w-full h-full object-cover opacity-60" alt="" />
                      </div>
                      <div>
                        <p className="font-black text-main group-hover:text-[#D4AF37] transition-colors">{service.name}</p>
                        <p className="text-[9px] text-muted font-bold uppercase">{service.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[11px] font-bold text-muted uppercase tracking-widest">{service.duration} Min</td>
                  <td className="px-8 py-6 text-lg font-black text-main tracking-tighter">${service.price}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase border ${service.status === 'ACTIVE' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-slate-500/30 text-slate-500'}`}>
                      {service.status === 'ACTIVE' ? 'OPERATIVO' : 'STANDBY'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => { setEditingService(service); setIsModalOpen(true); }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-[#D4AF37] transition-all"><Edit2 size={16} /></button>
                  </td>
                </tr>
              ))}
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

      {/* 🔮 FLOATING ACTION BUTTON (FAB) */}
      <div className="fixed bottom-10 right-10 z-[600]">
        <button
          onClick={() => { setEditingService(undefined); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black px-8 py-4 rounded-full shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 font-extrabold text-[10px] uppercase tracking-widest group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Nuevo</span>
        </button>
      </div>
    </>
  );
};
