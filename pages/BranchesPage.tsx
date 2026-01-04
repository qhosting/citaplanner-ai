
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MapPin, Phone, User, Plus, Search, Edit2, 
  CheckCircle2, Building2, Globe, Sparkles, 
  Trash2, Loader2, ArrowUpRight, Zap, Target
} from 'lucide-react';
import { api } from '../services/api';
import { Branch } from '../types';
import { toast } from 'sonner';
import { BranchModal } from '../components/BranchModal';
import { GoogleGenAI } from '@google/genai';

export const BranchesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: api.getBranches
  });

  const mutation = useMutation({
    mutationFn: (branch: Branch) => {
      if (editingBranch) return api.updateBranch(branch);
      const { id, ...data } = branch;
      return api.createBranch(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success("Arquitectura de red sincronizada correctamente.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success("Nodo de red desvinculado.");
    }
  });

  const handleRunAiAnalysis = async (branch: Branch) => {
    if (!process.env.API_KEY) return;
    setIsAnalyzing(branch.id);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const prompt = `Analiza esta ubicación para un estudio de belleza de ultra-lujo: "${branch.address}". 
      Dime si la zona es estratégica para el mercado elite en México. 
      Devuelve un veredicto breve (máximo 30 palabras) y sofisticado.`;

      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      toast.info(`Estrategia AI: ${res.text}`, { duration: 8000 });
    } catch (e) {
      toast.error("Error en la conexión neuronal AI.");
    } finally {
      setIsAnalyzing(null);
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                Network <span className="gold-text-gradient font-light">Infrastructure</span>
             </h1>
          </div>
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Global Nodes • Aurum Real Estate Intelligence</p>
        </div>
        <button 
          onClick={() => { setEditingBranch(undefined); setIsModalOpen(true); }}
          className="gold-btn text-black px-10 py-5 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
        >
          <Plus size={18} /> Integrar Nueva Sede
        </button>
      </div>

      <div className="glass-card p-4 rounded-[3rem] border-white/5 mb-12 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
           <input 
             type="text" 
             placeholder="Filtrar por nodo de red o zona geográfica..."
             className="w-full pl-16 pr-6 py-5 bg-black/20 border border-white/5 rounded-2xl text-white outline-none focus:border-[#D4AF37]/30 transition-all font-medium"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
        <div className="bg-white/5 px-6 py-5 rounded-2xl border border-white/5 flex items-center gap-3 shrink-0">
           <Globe size={18} className="text-[#D4AF37]" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Red: <span className="text-emerald-500">Sincronizado</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredBranches.map(branch => (
          <div key={branch.id} className="glass-card rounded-[3.5rem] p-10 border-white/5 hover:border-[#D4AF37]/20 transition-all group flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <Zap size={100} />
            </div>

            <div className="flex justify-between items-start mb-10 relative z-10">
               <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-tr from-[#111] to-black border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-2xl">
                  <Building2 size={28} />
               </div>
               <span className={`text-[9px] font-black px-4 py-2 rounded-full border ${branch.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                 {branch.status === 'ACTIVE' ? 'NODO ACTIVO' : 'MANTENIMIENTO'}
               </span>
            </div>
            
            <h3 className="text-3xl font-black text-white tracking-tight mb-4 uppercase group-hover:text-[#D4AF37] transition-colors">{branch.name}</h3>
            
            <div className="space-y-6 mb-10 flex-grow relative z-10">
               <div className="flex gap-5 items-start">
                  <div className="p-3 bg-white/5 rounded-xl text-slate-600"><MapPin size={18} /></div>
                  <span className="text-xs text-slate-400 font-medium leading-relaxed">{branch.address}</span>
               </div>
               <div className="flex gap-5 items-center">
                  <div className="p-3 bg-white/5 rounded-xl text-slate-600"><Phone size={18} /></div>
                  <span className="text-xs text-slate-300 font-bold uppercase tracking-widest">{branch.phone}</span>
               </div>
               <div className="flex gap-5 items-center">
                  <div className="p-3 bg-white/5 rounded-xl text-slate-600"><User size={18} /></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Responsable de Nodo</p>
                    <p className="text-xs text-white font-bold uppercase tracking-tight">{branch.manager}</p>
                  </div>
               </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex gap-4 relative z-10">
               <button 
                 onClick={() => handleRunAiAnalysis(branch)}
                 disabled={isAnalyzing === branch.id}
                 className="flex-grow bg-white/5 text-slate-400 py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest border border-white/5 hover:border-[#D4AF37]/40 hover:text-white transition-all flex items-center justify-center gap-2"
               >
                  {isAnalyzing === branch.id ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
                  Analista Nodo
               </button>
               <button 
                 onClick={() => { setEditingBranch(branch); setIsModalOpen(true); }}
                 className="p-4 bg-white/5 text-slate-500 hover:text-[#D4AF37] rounded-2xl transition-all border border-white/5"
               >
                  <Edit2 size={18} />
               </button>
               <button 
                 onClick={() => window.confirm("¿Confirmar desvinculación de nodo?") && deleteMutation.mutate(branch.id)}
                 className="p-4 bg-white/5 text-slate-500 hover:text-red-500 rounded-2xl transition-all border border-white/5"
               >
                  <Trash2 size={18} />
               </button>
            </div>
          </div>
        ))}

        {filteredBranches.length === 0 && (
          <div className="col-span-full py-40 glass-card rounded-[4rem] border-dashed border-white/10 text-center opacity-40">
             <Building2 size={64} className="mx-auto mb-8 text-slate-800" />
             <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">No se detectan nodos de red compatibles con el filtro</p>
          </div>
        )}
      </div>

      <BranchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(b) => mutation.mutate(b)}
        initialData={editingBranch}
      />
    </div>
  );
};
