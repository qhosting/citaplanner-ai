
import React, { useState } from 'react';
import { Phone, Mail, Plus, Search, Loader2, FileText, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../types';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientDossier } from '../components/ClientDossier';

export const ClientsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClientForDossier, setSelectedClientForDossier] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', skin_type: '', allergies: '', medical_conditions: '' });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: api.getClients
  });

  const mutation = useMutation({
    mutationFn: (newClient: Partial<User>) => api.createClient(newClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsFormOpen(false);
      setFormData({ name: '', email: '', phone: '', skin_type: '', allergies: '', medical_conditions: '' });
      toast.success("Perfil sincronizado en la base maestra.");
    }
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
            Client <span className="gold-text-gradient font-light">Intelligence</span>
          </h1>
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Network Masters • Aurum Global CRM</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="gold-btn text-black px-10 py-4 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest"
        >
          <Plus size={18} /> Registrar Socio Elite
        </button>
      </div>

      {isFormOpen && (
        <div className="glass-card p-10 rounded-[3rem] border-white/5 mb-12 animate-slide-up">
           <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <input required placeholder="Nombre Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-black/20 border border-white/5 rounded-2xl text-white font-medium" />
              <input required placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-black/20 border border-white/5 rounded-2xl text-white font-medium" />
              <input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-black/20 border border-white/5 rounded-2xl text-white font-medium" />
              <input placeholder="Tipo de Piel" value={formData.skin_type} onChange={e => setFormData({...formData, skin_type: e.target.value})} className="w-full p-4 bg-black/20 border border-white/5 rounded-2xl text-white font-medium" />
              <button type="submit" className="md:col-span-2 gold-btn py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest">Sincronizar Datos</button>
           </form>
        </div>
      )}

      <div className="relative mb-12">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={24} />
        <input 
          type="text" placeholder="Filtrar por identidad o red..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/5 rounded-3xl text-lg font-medium text-white outline-none focus:border-[#D4AF37]/30"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClients.map(client => (
          <div key={client.id} className="glass-card p-10 rounded-[3.5rem] border-white/5 hover:border-[#D4AF37]/20 transition-all group">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-[2rem] bg-black border border-white/10 flex items-center justify-center text-2xl font-black text-[#D4AF37]">
                {client.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-xl text-white tracking-tight leading-tight">{client.name}</h3>
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{client.phone}</p>
              </div>
            </div>
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <Mail size={16} className="text-[#D4AF37]" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{client.email || 'Sin Correo'}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setSelectedClientForDossier(client)} className="flex-1 bg-white/5 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white border border-white/5 hover:border-[#D4AF37]/40 transition-all">Expediente</button>
              <button className="flex-1 gold-btn py-4 rounded-2xl text-[9px] font-black text-black uppercase tracking-widest">Agendar</button>
            </div>
          </div>
        ))}
      </div>

      {selectedClientForDossier && (
        <ClientDossier 
          client={selectedClientForDossier}
          isOpen={!!selectedClientForDossier}
          onClose={() => setSelectedClientForDossier(null)}
          onUpdateClient={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
        />
      )}
    </div>
  );
};
