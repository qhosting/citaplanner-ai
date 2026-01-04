
import React, { useState, useMemo, useEffect } from 'react';
import { BriefcaseMedical, Search, Plus, Clock, Filter, Edit2, Trash2, CheckCircle2, XCircle, DollarSign, Tag, ImageIcon, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { Service } from '../types';
import { ServiceModal } from '../components/ServiceModal';
import { api } from '../services/api';
import { TableRowSkeleton, CardSkeleton } from '../components/Skeleton';

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                Service <span className="gold-text-gradient font-light">Inventory</span>
             </h1>
          </div>
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Operational Core • Aurum Business Solutions</p>
        </div>
        <div className="flex gap-4">
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 mr-4">
                <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}><LayoutGrid size={18} /></button>
                <button onClick={() => setViewMode('TABLE')} className={`p-2 rounded-xl transition-all ${viewMode === 'TABLE' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}><List size={18} /></button>
            </div>
            <button 
              onClick={() => { setEditingService(undefined); setIsModalOpen(true); }}
              className="gold-btn text-black px-10 py-4 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-2xl"
            >
              <Plus size={18} /> Nuevo Servicio Master
            </button>
        </div>
      </div>

      <div className="bg-white/5 p-5 rounded-[2.5rem] border border-white/5 mb-10 flex flex-col md:flex-row gap-6 justify-between items-center">
        <div className="relative w-full md:w-[450px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
          <input 
            type="text" placeholder="Filtrar por identidad de servicio..."
            className="w-full pl-14 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl text-white outline-none focus:border-[#D4AF37]/30 transition-all font-medium"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
            <select 
              className="w-full md:w-64 px-6 py-4 bg-black/40 border border-white/5 rounded-2xl text-zinc-300 text-[10px] font-black uppercase outline-none focus:border-[#D4AF37] cursor-pointer"
              value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">Todas las Ramas</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map(service => (
                <div key={service.id} className="glass-card rounded-[3rem] overflow-hidden border-white/5 group hover:border-[#D4AF37]/30 transition-all">
                   <div className="h-48 relative overflow-hidden">
                      <img src={service.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600'} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700" alt={service.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                      <div className="absolute bottom-6 left-8 flex items-center gap-2">
                         <span className="px-3 py-1 rounded-full bg-[#D4AF37] text-black font-black text-[8px] uppercase tracking-widest">${service.price}</span>
                         <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-black text-[8px] uppercase tracking-widest flex items-center gap-1"><Clock size={10} /> {service.duration}m</span>
                      </div>
                   </div>
                   <div className="p-10">
                      <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">{service.name}</h3>
                      <p className="text-slate-500 text-xs leading-relaxed mb-10 line-clamp-2">{service.description || 'Sin descripción técnica registrada.'}</p>
                      <div className="flex gap-3 pt-6 border-t border-white/5">
                         <button onClick={() => { setEditingService(service); setIsModalOpen(true); }} className="flex-1 bg-white/5 text-slate-300 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all">Configurar</button>
                         <button onClick={() => handleDelete(service.id)} className="p-4 bg-white/5 text-slate-600 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
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
                                        <p className="font-black text-white group-hover:text-[#D4AF37] transition-colors">{service.name}</p>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase">{service.category}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{service.duration} Min</td>
                            <td className="px-8 py-6 text-lg font-black text-white tracking-tighter">${service.price}</td>
                            <td className="px-8 py-6 text-center">
                                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase border ${service.status === 'ACTIVE' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-slate-500/30 text-slate-500'}`}>
                                    {service.status === 'ACTIVE' ? 'OPERATIVO' : 'STANDBY'}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <button onClick={() => { setEditingService(service); setIsModalOpen(true); }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-[#D4AF37] transition-all"><Edit2 size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      <ServiceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveService}
        initialData={editingService}
      />
    </div>
  );
};
