
import React, { useState } from 'react';
import { Phone, Mail, Plus, Search, Trash2, Edit2, StickyNote, Calendar, Gift, Zap, MessageSquare, AlertCircle, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';
import { Client } from '../types';
import { ClientDossier } from '../components/ClientDossier';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([
    { 
      id: '1', 
      name: 'Maria Garcia', 
      email: 'maria@example.com', 
      phone: '+1 555-0101', 
      notes: 'Cliente VIP. Prefiere citas por la mañana.', 
      birthDate: '1990-05-15',
      skinType: 'Tipo II - Sensible',
      allergies: 'Látex',
      medicalConditions: 'Ninguna',
      treatmentHistory: [
        { id: 't1', date: '2024-02-15T10:00:00Z', serviceName: 'Micropigmentación Cejas', notes: 'Saturación media, cicatrización perfecta.', pigmentsUsed: 'Soft Brown #2', professionalName: 'Valeria S.' }
      ]
    },
    { 
      id: '2', 
      name: 'Juan Perez', 
      email: 'juan@example.com', 
      phone: '+1 555-0102', 
      notes: '', 
      birthDate: new Date().toISOString().split('T')[0],
      treatmentHistory: []
    },
    { 
      id: '3', 
      name: 'Roberto Sanchez', 
      email: 'roberto@company.com', 
      phone: '+1 555-0103', 
      notes: 'Inactivo hace 4 meses.',
      treatmentHistory: []
    },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [selectedClientForDossier, setSelectedClientForDossier] = useState<Client | null>(null);
  
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '', birthDate: '' });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRetentionPulse = async (client: Client) => {
    setIsAnalyzing(client.id);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Redacta un mensaje de WhatsApp corto y muy cálido para reconectar con una clienta llamada ${client.name} que no ha venido al salón en 3 meses. El salón se llama Glow Beauty Studio. Sé profesional y sugiere que tenemos promociones nuevas. Máximo 30 palabras.`,
      });

      const message = response.text;
      toast(`AI Sugiere: "${message}"`, {
        action: {
          label: 'Enviar WA',
          onClick: () => window.open(`https://wa.me/${client.phone.replace(/\D/g,'')}?text=${encodeURIComponent(message || '')}`)
        }
      });
    } catch (error) {
      toast.error("Frecuencia de IA inestable");
    } finally {
      setIsAnalyzing(null);
    }
  };

  const isBirthdayToday = (dateString?: string) => {
    if (!dateString) return false;
    const today = new Date();
    const birth = new Date(dateString);
    return today.getUTCDate() === birth.getUTCDate() && today.getUTCMonth() === birth.getUTCMonth();
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setClients(clients.map(c => c.id === editingId ? { ...c, ...formData } : c));
      toast.success("Cliente actualizado");
      setEditingId(null);
    } else {
      const client: Client = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        ...formData,
        treatmentHistory: []
      };
      setClients([...clients, client]);
      toast.success("Cliente creado exitosamente");
    }
    setFormData({ name: '', email: '', phone: '', notes: '', birthDate: '' });
    setIsFormOpen(false);
  };

  const handleUpdateFromDossier = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    setSelectedClientForDossier(updatedClient);
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      notes: client.notes || '',
      birthDate: client.birthDate || ''
    });
    setEditingId(client.id);
    setIsFormOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="w-1 h-10 bg-gradient-to-b from-[#D4AF37] to-transparent rounded-full shadow-[0_0_20px_#D4AF37]"></div>
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                Client <span className="gold-text-gradient font-light">Intelligence</span>
             </h1>
          </div>
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Base de Datos Elite • Aurum Global CRM</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', email: '', phone: '', notes: '', birthDate: '' });
            setEditingId(null);
            setIsFormOpen(true);
          }}
          className="gold-btn text-black px-10 py-4 rounded-2xl flex items-center gap-3 font-black text-[9px] uppercase tracking-widest active:scale-95"
        >
          <Plus size={18} />
          {editingId ? 'Guardar Cambios' : 'Añadir Partner Elite'}
        </button>
      </div>

      {isFormOpen && (
        <div className="glass-card p-10 rounded-[3rem] border-[#D4AF37]/10 mb-12 animate-slide-up">
          <h3 className="text-2xl font-black mb-8 text-white uppercase tracking-tighter">
            {editingId ? 'Sincronizar Perfil' : 'Registro de Nueva Entidad'}
          </h3>
          <form onSubmit={handleSaveClient} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Identidad Completa</label>
              <input
                required
                placeholder="Nombre y Apellidos"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full pl-6 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl outline-none transition-all font-medium text-white focus:border-[#D4AF37]/50 placeholder-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Correo Electrónico</label>
              <input
                placeholder="partner@aurum.ai"
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-6 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl outline-none transition-all font-medium text-white focus:border-[#D4AF37]/50 placeholder-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Frecuencia Telefónica</label>
              <input
                placeholder="+52 1 234 5678"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full pl-6 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl outline-none transition-all font-medium text-white focus:border-[#D4AF37]/50 placeholder-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Ciclo de Nacimiento</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={e => setFormData({...formData, birthDate: e.target.value})}
                className="w-full pl-6 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl outline-none transition-all font-medium text-white focus:border-[#D4AF37]/50"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Notas de Personalización</label>
              <textarea
                rows={3}
                placeholder="Preferencias, sensibilidades, historial de marca..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full pl-6 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl outline-none transition-all font-medium text-white focus:border-[#D4AF37]/50 placeholder-slate-700 resize-none"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-6 mt-4">
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Cancelar Operación</button>
              <button type="submit" className="gold-btn px-12 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Confirmar Sincronización</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative mb-12 group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#D4AF37] transition-colors" size={24} />
        <input 
          type="text"
          placeholder="Busca por identidad, teléfono o canal digital..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/5 rounded-3xl focus:outline-none focus:border-[#D4AF37]/30 text-lg font-medium text-white transition-all placeholder-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClients.map(client => (
          <div key={client.id} className="glass-card p-10 rounded-[3.5rem] flex flex-col relative overflow-hidden group glass-card-hover transition-all duration-700 border-white/5">
            {isBirthdayToday(client.birthDate) && (
              <div className="absolute top-0 right-0 bg-[#D4AF37] text-black px-5 py-2 rounded-bl-[2rem] text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 z-10 animate-pulse">
                <Gift size={14} /> Ciclo de Vida Activo
              </div>
            )}
            
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[2rem] bg-[#111] border border-[#D4AF37]/20 flex items-center justify-center text-2xl font-black text-[#D4AF37] group-hover:scale-110 transition-transform">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-xl text-white tracking-tight leading-tight group-hover:text-[#D4AF37] transition-colors">{client.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Sincronizado</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 text-xs font-bold text-slate-500 mb-10 flex-grow">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <Mail size={16} className="text-[#D4AF37]" />
                <span className="truncate tracking-widest uppercase text-[10px]">{client.email || 'Canal no registrado'}</span>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <Phone size={16} className="text-[#D4AF37]" />
                <span className="tracking-widest uppercase text-[10px]">{client.phone}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-8 border-t border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setSelectedClientForDossier(client)}
                    className="flex items-center justify-center gap-2 bg-[#D4AF37]/10 text-[#D4AF37] py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#D4AF37]/20 transition-all border border-[#D4AF37]/10"
                  >
                    <FileText size={16} /> Expediente
                  </button>
                  <button 
                    onClick={() => handleRetentionPulse(client)}
                    disabled={isAnalyzing === client.id}
                    className="flex items-center justify-center gap-2 bg-white/5 text-slate-400 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:text-white transition-all border border-white/5"
                  >
                    {isAnalyzing === client.id ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    Growth AI
                  </button>
                </div>
                <button 
                    onClick={() => handleEdit(client)}
                    className="w-full py-4 text-slate-600 hover:text-[#D4AF37] transition-colors font-black text-[9px] uppercase tracking-[0.4em]"
                  >
                    Editar Master Profile
                </button>
            </div>
          </div>
        ))}
      </div>

      {selectedClientForDossier && (
        <ClientDossier 
          client={selectedClientForDossier}
          isOpen={!!selectedClientForDossier}
          onClose={() => setSelectedClientForDossier(null)}
          onUpdateClient={handleUpdateFromDossier}
        />
      )}
    </div>
  );
};
