
import React, { useState, useMemo } from 'react';
import { 
  Phone, Mail, Plus, Search, Loader2, FileText, Zap, 
  Filter, UserCheck, Star, ShieldCheck, MoreHorizontal, 
  Calendar, Trash2, Edit2, Globe, MessageSquare, Scale, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { Client, User } from '../types';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientDossier } from '../components/ClientDossier';
import { ClientModal } from '../components/ClientModal';

export const ClientsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [selectedClientForDossier, setSelectedClientForDossier] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: api.getClients
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<Client>) => {
      if (editingClient) return api.updateClient({ ...editingClient, ...data } as Client);
      return api.createClient(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsModalOpen(false);
      setEditingClient(undefined);
      toast.success("Estructura de datos sincronizada en la base maestra.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Socio desvinculado de la red.");
    }
  });

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clients, searchTerm]);

  const getMembershipInfo = (client: Client) => {
    const visits = client.treatmentHistory?.length || 0;
    if (visits > 5) return { label: 'Elite Partner', color: 'text-[#D4AF37]', icon: Star, bg: 'bg-[#D4AF37]/10' };
    if (visits > 2) return { label: 'Platinum', color: 'text-slate-300', icon: ShieldCheck, bg: 'bg-white/5' };
    return { label: 'New Member', color: 'text-emerald-500', icon: UserCheck, bg: 'bg-emerald-500/10' };
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                Client <span className="gold-text-gradient font-light">Intelligence</span>
             </h1>
          </div>
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Network Assets • Aurum Luxury CRM Hub</p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={() => { setEditingClient(undefined); setIsModalOpen(true); }}
            className="gold-btn text-black px-10 py-5 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest shadow-2xl transition-all active:scale-95"
           >
            <Plus size={18} /> Registrar Socio Elite
           </button>
        </div>
      </div>

      <div className="glass-card p-4 rounded-[3.5rem] border-white/5 mb-16 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
           <input 
             type="text" 
             placeholder="Filtrar por identidad, red o estatus de socio..."
             className="w-full pl-16 pr-6 py-6 bg-black/20 border border-white/5 rounded-3xl text-white outline-none focus:border-[#D4AF37]/30 transition-all font-medium"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredClients.map(client => {
          const membership = getMembershipInfo(client);
          return (
            <div key={client.id} className="glass-card p-10 rounded-[4rem] border-white/5 hover:border-[#D4AF37]/20 transition-all group flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                  <Zap size={100} />
               </div>

               <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-[#111] to-black border border-white/10 flex items-center justify-center text-3xl font-black text-[#D4AF37] shadow-2xl relative">
                     {client.name.charAt(0)}
                     <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-[#050505]" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 ${membership.bg}`}>
                       <membership.icon size={12} className={membership.color} />
                       <span className={`text-[8px] font-black uppercase tracking-widest ${membership.color}`}>{membership.label}</span>
                    </div>
                    {/* Badge de Consentimiento */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${client.consentAccepted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                       {client.consentAccepted ? <ShieldCheck size={10} /> : <ShieldAlert size={10} />}
                       <span className="text-[7px] font-black uppercase tracking-widest">{client.consentAccepted ? 'Legalmente Protegido' : 'Firma Pendiente'}</span>
                    </div>
                  </div>
               </div>

               <div className="mb-10 relative z-10">
                  <h3 className="font-black text-2xl text-white tracking-tighter uppercase leading-tight group-hover:text-[#D4AF37] transition-colors">{client.name}</h3>
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] mt-2">{client.phone}</p>
               </div>

               <div className="space-y-4 mb-10 flex-grow relative z-10">
                  <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                    <Mail size={16} className="text-slate-600" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{client.email || 'Sin Correo Institucional'}</span>
                  </div>
               </div>

               <div className="pt-8 border-t border-white/5 flex gap-4 relative z-10">
                  <button 
                    onClick={() => setSelectedClientForDossier(client)}
                    className="flex-1 bg-white/5 text-slate-400 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-white/5 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <FileText size={14} /> Expediente
                  </button>
                  <button onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="p-4 bg-white/5 text-slate-500 hover:text-[#D4AF37] rounded-2xl transition-all border border-white/5">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => window.confirm("¿Confirmar desvinculación de socio?") && deleteMutation.mutate(client.id)} className="p-4 bg-white/5 text-slate-500 hover:text-rose-500 rounded-2xl transition-all border border-white/5">
                    <Trash2 size={16} />
                  </button>
               </div>
            </div>
          );
        })}
      </div>

      {selectedClientForDossier && (
        <ClientDossier 
          client={selectedClientForDossier}
          isOpen={!!selectedClientForDossier}
          onClose={() => setSelectedClientForDossier(null)}
          onUpdateClient={(updated) => {
            mutation.mutate(updated);
            setSelectedClientForDossier(updated);
          }}
        />
      )}

      <ClientModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => mutation.mutate(data)}
        initialData={editingClient}
      />
    </div>
  );
};
