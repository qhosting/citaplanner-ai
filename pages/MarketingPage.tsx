import React, { useState } from 'react';
import { Megaphone, Mail, MessageCircle, Send, Plus, Users, Zap, Clock, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Campaign, AutomationRule, MarketingChannel } from '../types';
import { launchCampaign, saveAutomationRule } from '../services/integrationService';

export const MarketingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'AUTOMATIONS'>('CAMPAIGNS');

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: 'c1',
      name: 'Promoción de Verano',
      channel: 'EMAIL',
      status: 'SENT',
      content: '¡Descuentos del 20% en todos los servicios!',
      targetSegment: 'ALL',
      sentCount: 154,
      subject: 'Prepárate para el verano ☀️'
    },
    {
      id: 'c2',
      name: 'Recordatorio Check-up',
      channel: 'WHATSAPP',
      status: 'DRAFT',
      content: 'Hola! Hace tiempo no te vemos. Agenda tu cita hoy.',
      targetSegment: 'INACTIVE_90_DAYS'
    }
  ]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    name: '',
    channel: 'EMAIL',
    targetSegment: 'ALL',
    content: '',
    subject: ''
  });
  const [sending, setSending] = useState(false);

  const [automations, setAutomations] = useState<AutomationRule[]>([
    {
      id: 'a1',
      name: 'Solicitud de Reseña Post-Cita',
      isActive: true,
      triggerType: 'APPOINTMENT_COMPLETED',
      delayHours: 2,
      channel: 'WHATSAPP',
      templateMessage: 'Hola {{name}}, gracias por visitarnos. ¿Podrías dejarnos una reseña?'
    },
    {
      id: 'a2',
      name: 'Reactivación de Clientes',
      isActive: false,
      triggerType: 'CLIENT_INACTIVE',
      delayHours: 720,
      channel: 'EMAIL',
      templateMessage: 'Te extrañamos. Aquí tienes un cupón de descuento.'
    },
    {
      id: 'a3',
      name: 'Saludo de Cumpleaños',
      isActive: true,
      triggerType: 'BIRTHDAY',
      delayHours: 9,
      channel: 'WHATSAPP',
      templateMessage: '¡Feliz cumpleaños {{name}}! 🎉 Tienes un regalo esperando en tu próxima visita.'
    }
  ]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.content) return;

    const campaign: Campaign = {
      id: Date.now().toString(),
      name: newCampaign.name!,
      channel: newCampaign.channel || 'EMAIL',
      content: newCampaign.content!,
      targetSegment: newCampaign.targetSegment as any || 'ALL',
      status: 'DRAFT',
      subject: newCampaign.subject
    };

    setCampaigns([campaign, ...campaigns]);
    setNewCampaign({ name: '', channel: 'EMAIL', targetSegment: 'ALL', content: '', subject: '' });
    setIsCampaignModalOpen(false);
    toast.success("Borrador creado");
  };

  const handleSendCampaign = async (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    if (!window.confirm(`¿Estás seguro de enviar esta campaña a la audiencia seleccionada?`)) return;

    setSending(true);
    try {
      const result = await launchCampaign(campaign);
      if (result.success) {
        setCampaigns(prev => prev.map(c => 
          c.id === id ? { ...c, status: 'SENT', sentCount: result.sentCount } : c
        ));
        toast.success(result.message);
      } else {
        toast.error("Error al enviar la campaña.");
      }
    } catch (error) {
      toast.error("Error de conexión con N8N.");
    } finally {
      setSending(false);
    }
  };

  const toggleAutomation = async (id: string) => {
    const rule = automations.find(a => a.id === id);
    if (!rule) return;

    const newStatus = !rule.isActive;
    
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: newStatus } : a));

    try {
      await saveAutomationRule({ ...rule, isActive: newStatus });
      toast.success(newStatus ? 'Automatización activada' : 'Automatización desactivada');
    } catch (error) {
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !newStatus } : a));
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="text-indigo-600" />
            Marketing y Comunicaciones
          </h1>
          <p className="text-slate-500 mt-1">Crea campañas, envía newsletters y automatiza la fidelización.</p>
        </div>
        <div className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1">
            <Zap size={12} /> Conectado a N8N
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('CAMPAIGNS')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'CAMPAIGNS' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Mail size={18} /> Campañas Masivas
        </button>
        <button
          onClick={() => setActiveTab('AUTOMATIONS')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'AUTOMATIONS' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Zap size={18} /> Automatizaciones (Triggers)
        </button>
      </div>

      {activeTab === 'CAMPAIGNS' && (
        <div className="animate-fade-in-up">
           <div className="flex justify-between items-center mb-6">
             <h2 className="font-bold text-slate-700">Campañas Recientes</h2>
             <button 
               onClick={() => setIsCampaignModalOpen(true)}
               className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
             >
               <Plus size={18} /> Crear Campaña
             </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-start mb-3">
                      <div className={`p-2 rounded-lg ${campaign.channel === 'WHATSAPP' ? 'bg-green-100 text-green-600' : campaign.channel === 'EMAIL' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {getChannelIcon(campaign.channel)}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        campaign.status === 'SENT' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {campaign.status === 'SENT' ? 'ENVIADA' : 'BORRADOR'}
                      </span>
                   </div>
                   
                   <h3 className="font-bold text-slate-800 mb-1">{campaign.name}</h3>
                   <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                     <Users size={12} /> 
                     Audiencia: {campaign.targetSegment === 'ALL' ? 'Todos los Clientes' : 'Inactivos (>90 días)'}
                   </p>
                   
                   <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 mb-4 flex-grow italic border border-slate-100">
                     "{campaign.content}"
                   </div>

                   <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                     {campaign.status === 'SENT' ? (
                       <div className="text-sm text-green-600 flex items-center gap-1">
                         <CheckCircle2 size={16} /> Enviado a {campaign.sentCount}
                       </div>
                     ) : (
                       <button 
                         onClick={() => handleSendCampaign(campaign.id)}
                         disabled={sending}
                         className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-2 disabled:opacity-70"
                       >
                         {sending ? 'Enviando...' : <><Send size={14} /> Enviar Ahora</>}
                       </button>
                     )}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'AUTOMATIONS' && (
        <div className="animate-fade-in-up">
           <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6 flex gap-3 items-start">
              <AlertCircle className="text-indigo-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-indigo-900 text-sm">¿Cómo funciona?</h4>
                <p className="text-sm text-indigo-700 mt-1">
                  Estas reglas se ejecutan automáticamente en segundo plano (vía N8N/Cron). 
                  Activa los interruptores para habilitar el comportamiento deseado.
                </p>
              </div>
           </div>

           <div className="space-y-4">
              {automations.map(rule => (
                <div key={rule.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                   <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${rule.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                         <Zap size={24} />
                      </div>
                      <div>
                         <h3 className="font-bold text-slate-800 text-lg">{rule.name}</h3>
                         <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                               <Clock size={12} /> Retraso: {rule.delayHours}h
                            </span>
                            <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                               {getChannelIcon(rule.channel)} Canal: {rule.channel}
                            </span>
                         </div>
                         <p className="text-sm text-slate-400 mt-2 font-mono bg-slate-50 p-2 rounded inline-block border border-slate-100">
                            Plantilla: {rule.templateMessage}
                         </p>
                      </div>
                   </div>

                   <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${rule.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                        {rule.isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                      <button 
                        onClick={() => toggleAutomation(rule.id)}
                        className={`w-14 h-7 rounded-full transition-colors relative ${rule.isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-800">Nueva Campaña</h3>
                 <button onClick={() => setIsCampaignModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Play className="rotate-45" size={20}/></button>
              </div>
              <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Campaña</label>
                    <input 
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Ej: Promo Navidad"
                      value={newCampaign.name}
                      onChange={e => setNewCampaign({...newCampaign, name: e.target.value})}
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Canal</label>
                        <select 
                           className="w-full p-2 border border-slate-300 rounded-lg"
                           value={newCampaign.channel}
                           onChange={e => setNewCampaign({...newCampaign, channel: e.target.value as MarketingChannel})}
                        >
                           <option value="EMAIL">Email</option>
                           <option value="WHATSAPP">WhatsApp</option>
                           <option value="SMS">SMS</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Segmento</label>
                        <select 
                           className="w-full p-2 border border-slate-300 rounded-lg"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Asunto</label>
                        <input 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="Asunto del correo..."
                        value={newCampaign.subject}
                        onChange={e => setNewCampaign({...newCampaign, subject: e.target.value})}
                        />
                    </div>
                 )}

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contenido / Mensaje</label>
                    <textarea 
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                      placeholder="Escribe el contenido de tu mensaje aquí..."
                      value={newCampaign.content}
                      onChange={e => setNewCampaign({...newCampaign, content: e.target.value})}
                    />
                 </div>

                 <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsCampaignModalOpen(false)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                       Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                    >
                       Guardar Borrador
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};