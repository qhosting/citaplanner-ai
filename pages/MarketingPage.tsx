
import React, { useState } from 'react';
import { Megaphone, Mail, MessageCircle, Send, Plus, Users, Zap, Clock, CheckCircle2, AlertCircle, Play, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Campaign, AutomationRule, MarketingChannel } from '../types';
import { launchCampaign, saveAutomationRule } from '../services/integrationService';
import { api } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const MarketingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'AUTOMATIONS' | 'TEMPLATES'>('CAMPAIGNS');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', channel: 'WHATSAPP', content: '', subject: '' });
  
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    name: '',
    channel: 'EMAIL',
    targetSegment: 'ALL',
    content: '',
    subject: ''
  });
  const [sendingId, setSendingId] = useState<string | null>(null);

  // DATA FETCHING REAL
  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: api.getCampaigns
  });

  const { data: automations = [], isLoading: loadingAutomations } = useQuery({
    queryKey: ['automations'],
    queryFn: api.getAutomations
  });

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['marketing-templates'],
    queryFn: api.getMarketingTemplates
  });

  const createMutation = useMutation({
    mutationFn: api.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsCampaignModalOpen(false);
      setNewCampaign({ name: '', channel: 'EMAIL', targetSegment: 'ALL', content: '', subject: '' });
      toast.success("Campaña creada en borrador");
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: api.createMarketingTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-templates'] });
      setIsTemplateModalOpen(false);
      setNewTemplate({ name: '', channel: 'WHATSAPP', content: '', subject: '' });
      toast.success("Plantilla guardada");
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: api.deleteMarketingTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-templates'] });
      toast.success("Plantilla eliminada");
    }
  });

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.content) return;
    
    createMutation.mutate({
      ...newCampaign,
      status: 'DRAFT'
    });
  };

  const handleSendCampaign = async (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    if (!window.confirm(`¿Estás seguro de enviar esta campaña a la audiencia seleccionada?`)) return;

    setSendingId(id);
    try {
      const result = await launchCampaign(campaign);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        toast.success(result.message);
      } else {
        toast.error("Error al enviar la campaña.");
      }
    } catch (error) {
      toast.error("Error de conexión con proveedor de mensajería.");
    } finally {
      setSendingId(null);
    }
  };

  const toggleAutomation = async (id: string) => {
    const rule = automations.find(a => a.id === id);
    if (!rule) return;

    const newStatus = !rule.isActive;
    
    // Optimistic Update handled via invalidation, but we notify user
    try {
      await saveAutomationRule({ ...rule, isActive: newStatus });
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      toast.success(newStatus ? 'Automatización activada' : 'Automatización desactivada');
    } catch (error) {
      toast.error("Error guardando la configuración.");
    }
  };

  const getChannelIcon = (channel: MarketingChannel) => {
    switch (channel) {
      case 'EMAIL': return <Mail size={16} />;
      case 'WHATSAPP': return <MessageCircle size={16} />;
      case 'SMS': return <Zap size={16} />;
    }
  };

  if (loadingCampaigns || loadingAutomations || loadingTemplates) {
    return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
              Marketing <span className="gold-text-gradient font-light">Engine</span>
            </h1>
          </div>
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Automations & Elite Outreach Hub</p>
        </div>
        <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-5 py-2.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shrink-0 uppercase tracking-widest">
          <Zap size={14} className="animate-pulse" /> Conectado a N8N
        </div>
      </div>

      <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'CAMPAIGNS', label: 'Campañas Masivas', icon: Mail },
          { id: 'AUTOMATIONS', label: 'Automatizaciones', icon: Zap },
          { id: 'TEMPLATES', label: 'Biblioteca de Plantillas', icon: Plus }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-3 whitespace-nowrap border ${activeTab === tab.id ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black border-transparent shadow-lg shadow-[#D4AF37]/20' : 'bg-white/[0.02] text-zinc-500 border-white/5 hover:border-[#D4AF37]/20 hover:text-white'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'CAMPAIGNS' && (
        <div className="animate-entrance">
           <div className="flex justify-between items-center mb-10">
             <h2 className="font-black text-[10px] text-zinc-500 uppercase tracking-[0.3em]">Campañas Recientes</h2>
             <button 
               onClick={() => setIsCampaignModalOpen(true)}
               className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black px-8 py-4 rounded-[1.5rem] flex items-center gap-2 hover:scale-[1.02] transition-all font-black text-[9px] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20"
             >
               <Plus size={16} /> Crear Campaña
             </button>
           </div>

           {campaigns.length === 0 ? (
             <div className="text-center py-40 glass-card rounded-[4rem] border-dashed border-white/10 opacity-30">
               <Megaphone className="mx-auto text-[#D4AF37] mb-6 animate-pulse" size={64} />
               <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">No hay campañas registradas</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="glass-card p-8 rounded-[3.5rem] border-white/5 hover:border-[#D4AF37]/20 transition-all group flex flex-col relative overflow-hidden h-full bg-black/40">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                      {getChannelIcon(campaign.channel)}
                    </div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className={`p-4 rounded-2xl border ${campaign.channel === 'WHATSAPP' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : campaign.channel === 'EMAIL' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                          {getChannelIcon(campaign.channel)}
                        </div>
                        <span className={`text-[8px] font-black px-3 py-1.5 rounded-full border ${
                          campaign.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/5'
                        }`}>
                          {campaign.status === 'SENT' ? 'ENVIADA' : 'BORRADOR'}
                        </span>
                    </div>
                    
                    <h3 className="font-black text-2xl text-white tracking-tighter uppercase leading-tight mb-2 group-hover:text-[#D4AF37] transition-colors">{campaign.name}</h3>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-6 flex items-center gap-1.5">
                      <Users size={12} className="text-[#D4AF37]" /> 
                      Audiencia: {campaign.targetSegment === 'ALL' ? 'Todos los Clientes' : 'Inactivos (>90 días)'}
                    </p>
                    
                    <div className="bg-black/50 p-6 rounded-[2rem] text-sm text-zinc-300 mb-8 flex-grow italic border border-white/5 leading-relaxed">
                      "{campaign.content}"
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                      {campaign.status === 'SENT' ? (
                        <div className="text-[10px] font-black text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
                          <CheckCircle2 size={16} /> Enviado a {campaign.sentCount || 0}
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleSendCampaign(campaign.id)}
                          disabled={sendingId === campaign.id}
                          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
                        >
                          {sendingId === campaign.id ? <Loader2 size={14} className="animate-spin text-black" /> : <><Send size={14} /> Enviar Ahora</>}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {activeTab === 'TEMPLATES' && (
         <div className="animate-entrance">
            <div className="flex justify-between items-center mb-10">
              <h2 className="font-black text-[10px] text-zinc-500 uppercase tracking-[0.3em]">Biblioteca de Plantillas</h2>
              <button 
                onClick={() => setIsTemplateModalOpen(true)}
                className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black px-8 py-4 rounded-[1.5rem] flex items-center gap-2 hover:scale-[1.02] transition-all font-black text-[9px] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20"
              >
                <Plus size={16} /> Nueva Plantilla
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="text-center py-40 glass-card rounded-[4rem] border-dashed border-white/10 opacity-30">
                <Mail className="mx-auto text-[#D4AF37] mb-6 animate-pulse" size={64} />
                <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">No hay plantillas guardadas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {templates.map((template: any) => (
                   <div key={template.id} className="glass-card p-8 rounded-[3.5rem] border-white/5 hover:border-[#D4AF37]/20 transition-all group flex flex-col relative overflow-hidden h-full bg-black/40">
                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                       {getChannelIcon(template.channel as MarketingChannel)}
                     </div>

                     <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className={`p-4 rounded-2xl border ${template.channel === 'WHATSAPP' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : template.channel === 'EMAIL' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                          {getChannelIcon(template.channel as MarketingChannel)}
                        </div>
                        <button onClick={() => deleteTemplateMutation.mutate(template.id)} className="text-zinc-500 hover:text-rose-500 p-2 border border-white/5 rounded-xl bg-white/5 hover:bg-rose-500/10 transition-colors">
                           <Trash2 size={14} /> 
                        </button>
                     </div>
                     
                     <h3 className="font-black text-2xl text-white tracking-tighter uppercase leading-tight mb-2 group-hover:text-[#D4AF37] transition-colors">{template.name}</h3>
                     {template.subject && <p className="text-[9px] text-[#D4AF37] font-black uppercase tracking-widest mb-4">Asunto: {template.subject}</p>}
                     
                     <div className="bg-black/50 p-6 rounded-[2rem] text-sm text-zinc-300 mb-8 flex-grow border border-white/5 leading-relaxed italic animate-entrance">
                       {template.content}
                     </div>

                     <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{template.channel}</span>
                        <button onClick={() => {
                           setNewCampaign({
                              name: `Campaña: ${template.name}`,
                              channel: template.channel as MarketingChannel,
                              content: template.content,
                              subject: template.subject || ''
                           });
                           setActiveTab('CAMPAIGNS');
                           setIsCampaignModalOpen(true);
                        }} className="text-[10px] font-black text-[#D4AF37] uppercase hover:underline tracking-widest">
                           Usar en Campaña
                        </button>
                     </div>
                   </div>
                 ))}
              </div>
            )}
         </div>
       )}

      {activeTab === 'AUTOMATIONS' && (
        <div className="animate-entrance">
           <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-8 rounded-[2.5rem] mb-10 flex gap-5 items-start">
              <AlertCircle className="text-[#D4AF37] mt-0.5 shrink-0" size={20} />
              <div>
                <h4 className="font-black text-[#D4AF37] uppercase tracking-widest text-[10px] mb-1">Motor de Reglas Automatizadas</h4>
                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                  Estas reglas se ejecutan automáticamente en segundo plano (vía N8N/Cron). 
                  Activa los interruptores para habilitar el comportamiento deseado.
                </p>
              </div>
           </div>

           <div className="space-y-6">
              {automations.map(rule => (
                <div key={rule.id} className="glass-card p-8 rounded-[3rem] border-white/5 bg-black/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-[#D4AF37]/10 transition-all">
                   <div className="flex items-start gap-5">
                      <div className={`p-4 rounded-3xl border transition-all ${rule.isActive ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20' : 'bg-white/5 text-slate-600 border-white/5'}`}>
                         <Zap size={24} />
                      </div>
                      <div>
                         <h3 className="font-black text-xl text-white uppercase tracking-tight mb-2">{rule.name}</h3>
                         <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-semibold">
                            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 uppercase text-[9px] tracking-widest text-zinc-400">
                               <Clock size={12} className="text-[#D4AF37]" /> Retraso: {rule.delayHours}h
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 uppercase text-[9px] tracking-widest text-zinc-400">
                               {getChannelIcon(rule.channel)} Canal: {rule.channel}
                            </span>
                         </div>
                         <p className="text-[10px] text-[#D4AF37] font-mono mt-4 bg-black/60 px-4 py-2.5 rounded-xl border border-white/5 inline-block select-all">
                            Plantilla: {rule.templateMessage}
                         </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4 shrink-0 bg-black/40 px-6 py-4 rounded-2xl border border-white/5">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${rule.isActive ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {rule.isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                      <button 
                        onClick={() => toggleAutomation(rule.id)}
                        className={`w-14 h-7 rounded-full transition-all relative ${rule.isActive ? 'bg-[#D4AF37]' : 'bg-zinc-800'}`}
                      >
                         <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${rule.isActive ? 'left-8' : 'left-1'}`} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {isCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <div className="glass-card rounded-[3.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in border-white/10 bg-black">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
                 <h3 className="font-black text-sm text-white uppercase tracking-widest">Nueva Campaña</h3>
                 <button onClick={() => setIsCampaignModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreateCampaign} className="p-8 space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-2">Nombre de la Campaña</label>
                    <input 
                      required
                      className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37] transition-all"
                      placeholder="Ej: Promo Navidad"
                      value={newCampaign.name}
                      onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-2">Canal</label>
                        <select 
                           className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white font-black text-xs outline-none focus:border-[#D4AF37] cursor-pointer"
                           value={newCampaign.channel}
                           onChange={e => setNewCampaign({...newCampaign, channel: e.target.value as MarketingChannel})}
                        >
                           <option value="EMAIL">Email</option>
                           <option value="WHATSAPP">WhatsApp</option>
                           <option value="SMS">SMS</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-2">Segmento</label>
                        <select 
                           className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white font-black text-xs outline-none focus:border-[#D4AF37] cursor-pointer"
                           value={newCampaign.targetSegment}
                           onChange={e => setNewCampaign({...newCampaign, targetSegment: e.target.value as any})}
                        >
                           <option value="ALL">Todos los Clientes</option>
                           <option value="ACTIVE_LAST_30_DAYS">Activos (30 días)</option>
                           <option value="INACTIVE_90_DAYS">Inactivos (&gt;90 días)</option>
                        </select>
                    </div>
                 </div>

                 {newCampaign.channel === 'EMAIL' && (
                    <div>
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-2">Asunto</label>
                        <input 
                        className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37] transition-all"
                        placeholder="Asunto del correo..."
                        value={newCampaign.subject}
                        onChange={e => setNewCampaign({...newCampaign, subject: e.target.value})}
                        />
                    </div>
                 )}

                 <div>
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-2">Contenido / Mensaje</label>
                    <textarea 
                      required
                      rows={4}
                      className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white font-medium text-xs outline-none focus:border-[#D4AF37] transition-all resize-none"
                      placeholder="Escribe el contenido de tu mensaje aquí..."
                      value={newCampaign.content}
                      onChange={e => setNewCampaign({...newCampaign, content: e.target.value})}
                    />
                 </div>

                 <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                    <button 
                      type="button" 
                      onClick={() => setIsCampaignModalOpen(false)}
                      className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors px-4 py-2"
                    >
                       Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={createMutation.isPending}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 hover:scale-[1.02] transition-all"
                    >
                       {createMutation.isPending && <Loader2 className="animate-spin text-black" size={14} />}
                       Guardar Borrador
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {isTemplateModalOpen && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
            <div className="glass-card rounded-[3.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in border-white/10 bg-black">
               <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
                  <h3 className="font-black text-sm text-white uppercase tracking-widest">Nueva Plantilla Maestro</h3>
                  <button onClick={() => setIsTemplateModalOpen(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
               </div>
               <form onSubmit={(e) => {
                  e.preventDefault();
                  createTemplateMutation.mutate(newTemplate);
               }} className="p-8 space-y-6">
                  <div>
                     <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-2">Nombre de la Plantilla</label>
                     <input 
                       required
                       className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37] transition-all"
                       placeholder="Ej: Recordatorio VIP"
                       value={newTemplate.name}
                       onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                     />
                  </div>
                  
                  <div>
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-2">Canal de Comunicación</label>
                      <select 
                         className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white font-black text-xs outline-none focus:border-[#D4AF37] cursor-pointer"
                         value={newTemplate.channel}
                         onChange={e => setNewTemplate({...newTemplate, channel: e.target.value as any})}
                      >
                         <option value="WHATSAPP">WhatsApp</option>
                         <option value="EMAIL">Email</option>
                         <option value="SMS">SMS</option>
                      </select>
                  </div>

                  {newTemplate.channel === 'EMAIL' && (
                     <div>
                         <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-2">Asunto Predeterminado</label>
                         <input 
                         className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white font-bold text-xs outline-none focus:border-[#D4AF37] transition-all"
                         placeholder="Asunto del correo..."
                         value={newTemplate.subject}
                         onChange={e => setNewTemplate({...newTemplate, subject: e.target.value})}
                         />
                     </div>
                  )}

                  <div>
                     <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2.5 ml-2">Cuerpo del Mensaje</label>
                     <div className="mb-3 flex gap-2 flex-wrap">
                        {['{{NAME}}', '{{DATE}}', '{{BUSINESS}}'].map(tag => (
                           <button 
                              key={tag}
                              type="button"
                              onClick={() => setNewTemplate({...newTemplate, content: newTemplate.content + ' ' + tag})}
                              className="text-[9px] font-black bg-white/5 hover:bg-[#D4AF37] text-slate-400 hover:text-black px-3 py-1.5 rounded-xl border border-white/5 transition-colors font-mono uppercase tracking-widest"
                           >
                              {tag}
                           </button>
                        ))}
                     </div>
                     <textarea 
                       required
                       rows={4}
                       className="w-full p-5 bg-black border border-white/5 rounded-2xl text-white font-medium text-xs outline-none focus:border-[#D4AF37] transition-all resize-none"
                       placeholder="Escribe el contenido aquí..."
                       value={newTemplate.content}
                       onChange={e => setNewTemplate({...newTemplate, content: e.target.value})}
                     />
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                     <button 
                       type="button" 
                       onClick={() => setIsTemplateModalOpen(false)}
                       className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors px-4 py-2"
                     >
                        Cancelar
                     </button>
                     <button 
                       type="submit"
                       disabled={createTemplateMutation.isPending}
                       className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 hover:scale-[1.02] transition-all"
                     >
                        {createTemplateMutation.isPending && <Loader2 className="animate-spin text-black" size={14} />}
                        Guardar Plantilla
                     </button>
                  </div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};
