
import React, { useState, useRef } from 'react';
import { 
  X, FileText, Activity, ShieldAlert, Sparkles, Plus, 
  Calendar, User, Beaker, Wand2, Loader2, History, TrendingUp, Info, Scale, ShieldCheck, Download, 
  Camera, ChevronRight, Save, Eye, Scissors, Syringe, Droplet, ClipboardCheck
} from 'lucide-react';
import { Client, TreatmentRecord } from '../types';
import { toast } from 'sonner';
import { ConsentModal } from './ConsentModal';
import { api } from '../services/api';

interface ClientDossierProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onUpdateClient: (updated: Client) => void;
}

export const ClientDossier: React.FC<ClientDossierProps> = ({ client, isOpen, onClose, onUpdateClient }) => {
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'CLINICAL' | 'AI' | 'LEGAL' | 'GALLERY'>('RECORDS');
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  
  // Estado para edición biométrica
  const [isEditingClinical, setIsEditingClinical] = useState(false);
  const [tempClientData, setTempClientData] = useState<Partial<Client>>(client);

  const [newRecord, setNewRecord] = useState<Partial<TreatmentRecord>>({
    serviceName: '',
    notes: '',
    pigmentsUsed: '',
    needleType: '',
    aftercareInstructions: '',
    professionalName: 'Staff Master Aurum'
  });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const record: TreatmentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      serviceName: newRecord.serviceName || 'Tratamiento Elite',
      notes: newRecord.notes || '',
      pigmentsUsed: newRecord.pigmentsUsed,
      needleType: newRecord.needleType,
      aftercareInstructions: newRecord.aftercareInstructions,
      professionalName: newRecord.professionalName || 'Staff Master Aurum'
    };

    const updatedClient = {
      ...client,
      treatmentHistory: [record, ...client.treatmentHistory]
    };
    onUpdateClient(updatedClient);
    setIsAddingRecord(false);
    setNewRecord({ serviceName: '', notes: '', pigmentsUsed: '', needleType: '', aftercareInstructions: '', professionalName: 'Staff Master Aurum' });
    toast.success("Protocolo técnico registrado en el expediente");
  };

  const handleSaveClinical = () => {
    onUpdateClient({ ...client, ...tempClientData });
    setIsEditingClinical(false);
    toast.success("Perfil biométrico sincronizado");
  };

  const handleConsentConfirm = (type: string) => {
    const updatedClient = {
      ...client,
      consentAccepted: true,
      consentDate: new Date().toISOString(),
      consentType: type
    };
    onUpdateClient(updatedClient);
    setIsConsentModalOpen(false);
    toast.success("Consentimiento firmado digitalmente");
  };

  const handleRunAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);

    try {
      const prompt = `
        Analiza este expediente clínico de estética avanzada:
        Nombre: ${client.name}
        Tipo de Piel: ${client.skinType || 'No especificado'}
        Alergias: ${client.allergies || 'Ninguna'}
        Historial: ${JSON.stringify(client.treatmentHistory)}
        
        Genera un veredicto técnico de mantenimiento y precauciones. Sé sofisticado. Máximo 50 palabras.
      `;

      const response = await api.generateAIContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      setAiAnalysis(response.text);
    } catch (error) {
      toast.error("Error en el núcleo neuronal AI");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-2xl z-[150] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-6xl rounded-[4rem] overflow-hidden flex flex-col max-h-[92vh] border-[#D4AF37]/20 shadow-[0_0_120px_rgba(212,175,55,0.12)] animate-scale-in">
        
        {/* Header Elite */}
        <div className="p-10 border-b border-white/5 flex justify-between items-start bg-white/5">
          <div className="flex gap-10">
            <div className="relative">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-[#111] to-black border border-[#D4AF37]/30 flex items-center justify-center text-4xl font-black text-[#D4AF37] shadow-2xl">
                {client.name.charAt(0)}
                </div>
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-[#050505] flex items-center justify-center ${client.consentAccepted ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}>
                    {client.consentAccepted ? <ShieldCheck size={14} className="text-white" /> : <ShieldAlert size={14} className="text-white" />}
                </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500">Expediente Maestro de Operaciones</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-slate-400 uppercase tracking-widest">Aurum Layer-8 Secured</span>
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">{client.name}</h2>
              <div className="flex items-center gap-6 mt-4">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2"><Activity size={12} className="text-[#D4AF37]"/> ID Red: {client.phone}</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2"><Calendar size={12} className="text-[#D4AF37]"/> Miembro desde: {new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-[1.5rem] transition-all border border-white/5">
            <X size={28} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-10 border-b border-white/5 bg-black/40 overflow-x-auto no-scrollbar">
          {[
            { id: 'RECORDS', label: 'Protocolos', icon: History },
            { id: 'CLINICAL', label: 'Biometría', icon: Activity },
            { id: 'GALLERY', label: 'Galería Visual', icon: Camera },
            { id: 'AI', label: 'Estratega AI', icon: Wand2 },
            { id: 'LEGAL', label: 'Cumplimiento', icon: Scale }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-10 py-6 text-[10px] font-black uppercase tracking-[0.35em] transition-all border-b-2 shrink-0 ${
                activeTab === tab.id ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-[#080808]/50">
          
          {/* TAB: RECORDS (HISTORY) */}
          {activeTab === 'RECORDS' && (
            <div className="space-y-10 animate-entrance">
              <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Historial de Protocolos</h3>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Evolución técnica y registro de aplicaciones</p>
                </div>
                <button 
                  onClick={() => setIsAddingRecord(true)}
                  className="gold-btn px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl"
                >
                  <Plus size={18} /> Nueva Sesión
                </button>
              </div>

              {isAddingRecord && (
                <div className="glass-card p-10 rounded-[3rem] border-[#D4AF37]/30 mb-10 animate-slide-up bg-gradient-to-tr from-[#0a0a0a] to-black">
                   <form onSubmit={handleAddRecord} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-black text-[#D4AF37] uppercase mb-3 block ml-1 tracking-[0.2em]">Servicio Aplicado</label>
                        <input required className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-[#D4AF37] transition-all font-bold" placeholder="Ej: Microblading Retoque Master" value={newRecord.serviceName} onChange={e => setNewRecord({...newRecord, serviceName: e.target.value})} />
                      </div>
                      
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-[0.2em]">Pigmentos / Materiales</label>
                        <div className="relative">
                            <Droplet className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input className="w-full bg-black/60 border border-white/10 rounded-2xl pl-14 pr-5 py-5 text-white outline-none focus:border-[#D4AF37] transition-all text-xs" placeholder="Mezcla, Marca, Lote..." value={newRecord.pigmentsUsed} onChange={e => setNewRecord({...newRecord, pigmentsUsed: e.target.value})} />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-[0.2em]">Configuración Técnica (Agujas)</label>
                        <div className="relative">
                            <Syringe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                            <input className="w-full bg-black/60 border border-white/10 rounded-2xl pl-14 pr-5 py-5 text-white outline-none focus:border-[#D4AF37] transition-all text-xs" placeholder="Ej: 1RL 0.25mm / 3RL Nano" value={newRecord.needleType} onChange={e => setNewRecord({...newRecord, needleType: e.target.value})} />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-3 block ml-1 tracking-[0.2em]">Observaciones Técnicas & Mapa</label>
                        <textarea rows={3} className="w-full bg-black/60 border border-white/10 rounded-[2rem] p-6 text-white outline-none focus:border-[#D4AF37] transition-all resize-none text-xs font-medium leading-relaxed" placeholder="Detalles de la piel durante el proceso, sangrado, saturación..." value={newRecord.notes} onChange={e => setNewRecord({...newRecord, notes: e.target.value})} />
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-6 pt-6 border-t border-white/5">
                        <button type="button" onClick={() => setIsAddingRecord(false)} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest">Descartar</button>
                        <button type="submit" className="gold-btn px-14 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl">Registrar en Expediente</button>
                      </div>
                   </form>
                </div>
              )}

              <div className="space-y-6">
                {client.treatmentHistory.length === 0 ? (
                  <div className="p-32 text-center glass-card rounded-[4rem] border-dashed border-white/5 opacity-30">
                    <ClipboardCheck size={64} className="mx-auto mb-6 text-slate-700" />
                    <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px]">Expediente técnico sin entradas previas</p>
                  </div>
                ) : (
                  client.treatmentHistory.map(record => (
                    <div key={record.id} className="glass-card p-10 rounded-[3.5rem] border-white/5 hover:border-[#D4AF37]/20 transition-all group bg-white/[0.01]">
                       <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
                          <div className="flex gap-8 items-start">
                             <div className="w-16 h-16 bg-[#D4AF37]/10 text-[#D4AF37] rounded-[1.5rem] flex items-center justify-center shrink-0 border border-[#D4AF37]/10 group-hover:scale-110 transition-transform">
                                <Activity size={28} />
                             </div>
                             <div>
                                <h4 className="font-black text-2xl text-white tracking-tighter uppercase group-hover:text-[#D4AF37] transition-colors">{record.serviceName}</h4>
                                <div className="flex items-center gap-6 mt-2">
                                    <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                                        <Calendar size={12} /> {new Date(record.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Artista: {record.professionalName}</p>
                                </div>
                             </div>
                          </div>
                          <div className="flex flex-wrap gap-4">
                             {record.pigmentsUsed && <span className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[8px] font-black text-slate-400 uppercase tracking-widest">Pigmentos: {record.pigmentsUsed}</span>}
                             {record.needleType && <span className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[8px] font-black text-slate-400 uppercase tracking-widest">Needle: {record.needleType}</span>}
                          </div>
                       </div>
                       
                       <div className="mt-10 p-8 bg-black/40 rounded-[2rem] border border-white/5">
                          <p className="text-slate-400 text-sm leading-relaxed italic font-medium">"{record.notes}"</p>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: CLINICAL (BIOMETRY) */}
          {activeTab === 'CLINICAL' && (
            <div className="animate-entrance space-y-12 max-w-4xl mx-auto">
               <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Perfil Biométrico</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">Datos anatómicos y restricciones clínicas</p>
                  </div>
                  {!isEditingClinical ? (
                    <button onClick={() => setIsEditingClinical(true)} className="flex items-center gap-2 text-[10px] font-black text-[#D4AF37] uppercase tracking-widest border border-[#D4AF37]/30 px-6 py-3 rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all">Actualizar Ficha</button>
                  ) : (
                    <div className="flex gap-4">
                        <button onClick={() => setIsEditingClinical(false)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cancelar</button>
                        <button onClick={handleSaveClinical} className="flex items-center gap-2 text-[10px] font-black text-black bg-[#D4AF37] uppercase tracking-widest px-6 py-3 rounded-xl shadow-xl"><Save size={14}/> Guardar</button>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                      <h4 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-8 flex items-center gap-3"><Activity size={16}/> Clasificación Dermatológica</h4>
                      <div className="space-y-8">
                         <div>
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Tipo de Piel (Escala Fitzpatrick)</label>
                            {isEditingClinical ? (
                                <input className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm" value={tempClientData.skinType} onChange={e => setTempClientData({...tempClientData, skinType: e.target.value})} />
                            ) : (
                                <p className="text-xl font-black text-white uppercase tracking-tight">{client.skinType || 'Sin Clasificar'}</p>
                            )}
                         </div>
                         <div>
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Alergias Conocidas</label>
                            {isEditingClinical ? (
                                <input className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm" value={tempClientData.allergies} onChange={e => setTempClientData({...tempClientData, allergies: e.target.value})} />
                            ) : (
                                <p className={`text-sm font-bold uppercase tracking-widest ${client.allergies ? 'text-rose-500' : 'text-emerald-500'}`}>{client.allergies || 'Ninguna Restricción Detectada'}</p>
                            )}
                         </div>
                      </div>
                  </div>

                  <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                      <h4 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-8 flex items-center gap-3"><ShieldAlert size={16}/> Historial Médico</h4>
                      <div className="space-y-8">
                         <div>
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Condiciones / Medicación</label>
                            {isEditingClinical ? (
                                <textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm resize-none" rows={3} value={tempClientData.medicalConditions} onChange={e => setTempClientData({...tempClientData, medicalConditions: e.target.value})} />
                            ) : (
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">{client.medicalConditions || 'No se reportan condiciones especiales de salud.'}</p>
                            )}
                         </div>
                         <div className="pt-6 border-t border-white/5 flex items-center gap-4">
                            <div className="p-3 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37]"><Info size={16}/></div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed tracking-widest">Información reservada bajo protocolos de confidencialidad Aurum HIPAA.</p>
                         </div>
                      </div>
                  </div>
               </div>
            </div>
          )}

          {/* TAB: GALLERY (NEW) */}
          {activeTab === 'GALLERY' && (
            <div className="animate-entrance space-y-12">
               <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Evolución Visual</h3>
                  <button className="gold-btn px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Camera size={18} /> Añadir Evidencia
                  </button>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[1,2,3].map(i => (
                    <div key={i} className="group relative aspect-square bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-[#D4AF37]/30 transition-all">
                       <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all" />
                       <div className="absolute bottom-6 left-6 z-10 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                          <p className="text-[8px] font-black text-white uppercase tracking-[0.2em] mb-1">Sesión #{4-i}</p>
                          <p className="text-[10px] font-black text-[#D4AF37] uppercase">Antes / Después</p>
                       </div>
                       <div className="flex items-center justify-center h-full opacity-10 group-hover:opacity-100 transition-opacity">
                          <Eye size={48} className="text-slate-700" />
                       </div>
                    </div>
                  ))}
                  <div className="aspect-square bg-black border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                     <Plus size={32} className="text-slate-600" />
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Subir Imagen</p>
                  </div>
               </div>
            </div>
          )}

          {/* TAB: AI ANALYSIS */}
          {activeTab === 'AI' && (
            <div className="animate-entrance space-y-10 max-w-3xl mx-auto">
               <div className="glass-card p-12 rounded-[4rem] border-[#D4AF37]/10 bg-gradient-to-tr from-black to-[#050505] relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[80px]" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-12">
                        <div className="p-4 bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] rounded-3xl shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                          <Wand2 size={32} className="text-black" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Consultoría AI <span className="text-[#D4AF37] font-light italic">Master</span></h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">Análisis de patrones histopatológicos simulados</p>
                        </div>
                    </div>

                    {isAnalyzing ? (
                        <div className="py-20 text-center space-y-8">
                           <Loader2 className="animate-spin text-[#D4AF37] mx-auto" size={48} />
                           <p className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Sincronizando red neuronal con historial clínico...</p>
                        </div>
                    ) : aiAnalysis ? (
                        <div className="space-y-10">
                            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-10 rounded-[3rem] relative">
                                <p className="text-2xl font-light text-slate-200 leading-relaxed italic tracking-tight">"{aiAnalysis}"</p>
                                <Info className="absolute top-10 right-10 text-[#D4AF37]/20" size={24} />
                            </div>
                            <div className="flex justify-center">
                                <button onClick={handleRunAIAnalysis} className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] border-b border-[#D4AF37]/20 pb-2 hover:text-white transition-colors">Solicitar Nueva Predicción</button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                           <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[10px] mb-10">Sin veredicto activo en este nodo</p>
                           <button onClick={handleRunAIAnalysis} className="gold-btn px-16 py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl">Iniciar Diagnóstico AI</button>
                        </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {/* TAB: LEGAL (COMPLIANCE) */}
          {activeTab === 'LEGAL' && (
            <div className="animate-entrance space-y-12 max-w-5xl mx-auto">
               <div className="flex flex-col md:flex-row gap-10">
                  <div className="flex-1 glass-card p-12 rounded-[3.5rem] border-white/5 bg-gradient-to-tr from-[#050505] to-black flex flex-col items-center text-center">
                      <div className={`w-28 h-28 rounded-[2.5rem] border flex items-center justify-center mb-10 shadow-2xl transition-all duration-700 ${client.consentAccepted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 scale-105' : 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse'}`}>
                         {client.consentAccepted ? <ShieldCheck size={56} /> : <Scale size={56} />}
                      </div>
                      <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">
                        {client.consentAccepted ? 'Socio Protegido' : 'Cumplimiento Pendiente'}
                      </h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[300px] mb-12">
                        {client.consentAccepted 
                          ? `Protocolo de seguridad firmado el ${new Date(client.consentDate!).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}. Autorizado para todos los servicios máster.`
                          : 'Este socio requiere la firma del deslinde de responsabilidad y el protocolo de consentimiento antes de cualquier intervención.'}
                      </p>
                      
                      {!client.consentAccepted ? (
                        <button 
                          onClick={() => setIsConsentModalOpen(true)}
                          className="gold-btn w-full py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4"
                        >
                          <Scissors size={18} /> Firmar Consentimiento
                        </button>
                      ) : (
                        <button className="bg-white/5 text-slate-400 w-full py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-4 shadow-xl">
                           <Download size={20} /> Certificado de Conformidad
                        </button>
                      )}
                  </div>

                  <div className="flex-1 space-y-8">
                     <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-black/20">
                        <h5 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] mb-6 flex items-center gap-3"><Info size={16}/> Registro de Auditoría</h5>
                        <div className="space-y-6">
                           <div className="flex justify-between text-[12px]"><span className="text-slate-500 font-bold uppercase tracking-widest">Estatus Legal:</span><span className={client.consentAccepted ? 'text-emerald-500 font-black' : 'text-rose-500 font-black'}>{client.consentAccepted ? 'VERIFICADO' : 'PENDIENTE'}</span></div>
                           <div className="flex justify-between text-[12px]"><span className="text-slate-500 font-bold uppercase tracking-widest">Tipo Protocolo:</span><span className="text-white font-black">{client.consentType || 'N/A'}</span></div>
                           <div className="flex justify-between text-[12px]"><span className="text-slate-500 font-bold uppercase tracking-widest">Firma Hash:</span><span className="text-white font-mono text-[10px] font-black opacity-40">{client.consentAccepted ? '8888-AUM-777-SEC' : 'PENDING_VALIDATION'}</span></div>
                           <div className="flex justify-between text-[12px]"><span className="text-slate-500 font-bold uppercase tracking-widest">Timestamp:</span><span className="text-white font-black">{client.consentDate ? new Date(client.consentDate).toLocaleTimeString() : 'N/A'}</span></div>
                        </div>
                     </div>
                     <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-10 rounded-[3rem]">
                        <p className="text-[10px] text-slate-500 font-black leading-relaxed uppercase tracking-[0.2em] text-center italic">
                           "La seguridad clínica y la protección legal mutua son la base de la exclusividad en Aurum."
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Consent Modal Overlay */}
        <ConsentModal 
          isOpen={isConsentModalOpen} 
          onClose={() => setIsConsentModalOpen(false)} 
          onConfirm={handleConsentConfirm} 
          clientName={client.name} 
        />

        {/* Footer Master */}
        <div className="p-10 bg-black/60 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Aurum Compliance Protocol <span className="text-white">v2.6</span></span>
          </div>
          <div className="flex gap-8 items-center">
             <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest hidden md:block">Node Polanco CDMX NodeMaster-01</p>
             <div className="h-4 w-px bg-white/5" />
             <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">© 2026 CitaPlanner Infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  );
};
