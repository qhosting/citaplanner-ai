
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, User, Plus, Search, Edit2, CheckCircle2, MoreVertical, Building2, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { Branch } from '../types';
import { toast } from 'sonner';

export const BranchesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: api.getBranches
  });

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddBranch = () => {
    toast.info("Funcionalidad para añadir sucursal disponible en plan Citaplanner Enterprise");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Sedes y Sucursales</h1>
          <p className="text-slate-500 font-medium">Gestiona múltiples ubicaciones desde un solo panel maestro.</p>
        </div>
        <button 
          onClick={handleAddBranch}
          className="burgundy-gradient text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#630E14]/20 flex items-center gap-3 active:scale-95 transition-all"
        >
          <Plus size={18} /> Añadir Sede
        </button>
      </div>

      <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           <input 
             type="text" 
             placeholder="Filtrar por nombre o ubicación..."
             className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-50 rounded-2xl focus:ring-2 focus:ring-[#630E14] outline-none transition-all font-medium"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[3rem]" />)
        ) : filteredBranches.map(branch => (
          <div key={branch.id} className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm hover:shadow-2xl transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-8">
               <div className="burgundy-gradient p-4 rounded-3xl text-white shadow-lg">
                  <Building2 size={24} />
               </div>
               <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border ${branch.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                 {branch.status === 'ACTIVE' ? 'OPERATIVA' : 'MANTENIMIENTO'}
               </span>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{branch.name}</h3>
            
            <div className="space-y-4 mb-8 flex-grow">
               <div className="flex gap-4 items-start text-sm text-slate-500 font-medium">
                  <MapPin size={18} className="brand-text-gold shrink-0 mt-0.5" />
                  <span>{branch.address}</span>
               </div>
               <div className="flex gap-4 items-center text-sm text-slate-500 font-medium">
                  <Phone size={18} className="brand-text-gold shrink-0" />
                  <span>{branch.phone}</span>
               </div>
               <div className="flex gap-4 items-center text-sm text-slate-500 font-medium">
                  <User size={18} className="brand-text-gold shrink-0" />
                  <span>Gerente: {branch.manager}</span>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-50 flex gap-4">
               <button className="flex-grow burgundy-gradient text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:translate-y-[-2px] transition-all">
                  Gestionar Sede
               </button>
               <button className="p-4 bg-slate-50 text-slate-400 hover:text-[#C5A028] rounded-2xl transition-colors">
                  <Edit2 size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
