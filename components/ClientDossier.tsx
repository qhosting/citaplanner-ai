
import React, { useState, useRef } from 'react';
import { 
  X, FileText, Activity, ShieldAlert, Sparkles, Plus, 
  Calendar, User, Beaker, Wand2, Loader2, History, TrendingUp, Info, Scale, ShieldCheck, Download, 
  Camera, ChevronRight, Save, Eye, Scissors, Syringe, Droplet, ClipboardCheck, ScrollText
} from 'lucide-react';
import { Client, TreatmentRecord } from '../types';
import { toast } from 'sonner';
import { ConsentModal } from './ConsentModal';
import { api } from '../services/api';
import { LashDiagnosisForm } from './LashDiagnosisForm';

interface ClientDossierProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onUpdateClient: (updated: Client) => void;
}

export const ClientDossier: React.FC<ClientDossierProps> = ({ client, isOpen, onClose, onUpdateClient }) => {
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'CLINICAL' | 'DIAGNOSIS' | 'AI' | 'LEGAL' | 'GALLERY'>('RECORDS');
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
    <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-10">
      <div className="glass-card w-full h-full sm:h-[88vh] sm:max-w-4xl lg:max-w-5xl sm:rounded-[2rem] overflow-hidden flex flex-col border-[#D4AF37]/20 shadow-[0_0_80px_rgba(212,175,55,0.08)] animate-scale-in">
        
        <div className="px-4 py-3 sm:px-6 sm:py-4 md:px-8 border-b border-white/5 flex justify-between items-center bg-white/5 gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#111] to-black border border-[#D4AF37]/30 flex items-center justify-center text-lg sm:text-xl font-bold text-[#D4AF37] shadow-xl">
                {client.name.charAt(0)}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border-2 border-[#050505] flex items-center justify-center ${client.consentAccepted ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}>
                {client.consentAccepted ? <ShieldCheck size={9} className="text-white" /> : <ShieldAlert size={9} className="text-white" />}
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight uppercase leading-none flex items-center gap-2">
                {client.name}
                {(client.lashDiagnosis?.conditions?.cyanoacrylateHypersensitivity || client.lashDiagnosis?.conditions?.glueAllergy) && (
                  <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[8px] font-black uppercase tracking-wider rounded-md animate-pulse">
                    Alergia Pegamento
                  </span>
                )}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Activity size={9} className="text-[#D4AF37]/80"/> ID Red: {client.phone}</p>
                <div className="hidden xs:block w-0.5 h-0.5 rounded-full bg-slate-800" />
                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Calendar size={9} className="text-[#D4AF37]/80"/> Miembro desde: {new Date().getFullYear()}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 sm:p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-full transition-all border border-white/5 cursor-pointer shrink-0">
            <X size={14} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-4 sm:px-6 md:px-8 border-b border-white/5 bg-black/40 overflow-x-auto no-scrollbar">
          {[
            { id: 'RECORDS', label: 'Protocolos', icon: History },
            { id: 'CLINICAL', label: 'Biometría', icon: Activity },
            { id: 'DIAGNOSIS', label: 'Ficha Técnica', icon: ScrollText },
            { id: 'GALLERY', label: 'Galería Visual', icon: Camera },
            { id: 'AI', label: 'Estratega AI', icon: Wand2 },
            { id: 'LEGAL', label: 'Cumplimiento', icon: Scale }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 sm:px-4.5 py-3 md:py-3.5 text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider transition-all border-b-2 shrink-0 cursor-pointer ${
                activeTab === tab.id ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={12} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-8 bg-[#080808]/50">
          
          {/* TAB: RECORDS (HISTORY) */}
          {activeTab === 'RECORDS' && (
            <div className="space-y-6 sm:space-y-8 animate-entrance">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">Historial de Protocolos</h3>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">Evolución técnica y registro de aplicaciones</p>
                </div>
                <button 
                  onClick={() => setIsAddingRecord(true)}
                  className="gold-btn px-6 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl self-start sm:self-auto"
                >
                  <Plus size={14} /> Nueva Sesión
                </button>
              </div>

              {isAddingRecord && (
                <div className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-[#D4AF37]/30 mb-6 animate-slide-up bg-gradient-to-tr from-[#0a0a0a] to-black">
                   <form onSubmit={handleAddRecord} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="md:col-span-2">
                        <label className="text-[9px] font-black text-[#D4AF37] uppercase mb-2 block ml-0.5 tracking-wider">Servicio Aplicado</label>
                        <input required className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#D4AF37] transition-all font-bold text-xs sm:text-sm" placeholder="Ej: Microblading Retoque Master" value={newRecord.serviceName} onChange={e => setNewRecord({...newRecord, serviceName: e.target.value})} />
                      </div>
                      
                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block ml-0.5 tracking-wider">Pigmentos / Materiales</label>
                        <div className="relative">
                            <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                            <input className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-[#D4AF37] transition-all text-xs" placeholder="Mezcla, Marca, Lote..." value={newRecord.pigmentsUsed} onChange={e => setNewRecord({...newRecord, pigmentsUsed: e.target.value})} />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block ml-0.5 tracking-wider">Configuración Técnica (Agujas)</label>
                        <div className="relative">
                            <Syringe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                            <input className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-[#D4AF37] transition-all text-xs" placeholder="Ej: 1RL 0.25mm / 3RL Nano" value={newRecord.needleType} onChange={e => setNewRecord({...newRecord, needleType: e.target.value})} />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase mb-2 block ml-0.5 tracking-wider">Observaciones Técnicas & Mapa</label>
                        <textarea rows={3} className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#D4AF37] transition-all resize-none text-xs font-medium leading-relaxed" placeholder="Detalles de la piel durante el proceso, sangrado, saturación..." value={newRecord.notes} onChange={e => setNewRecord({...newRecord, notes: e.target.value})} />
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-4 pt-4 border-t border-white/5">
                        <button type="button" onClick={() => setIsAddingRecord(false)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-wider">Descartar</button>
                        <button type="submit" className="gold-btn px-8 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xl">Registrar en Expediente</button>
                      </div>
                   </form>
                </div>
              )}

              <div className="space-y-6">
                {client.treatmentHistory.length === 0 ? (
                  <div className="p-16 sm:p-24 text-center glass-card rounded-[2rem] border-dashed border-white/5 opacity-30">
                    <ClipboardCheck size={48} className="mx-auto mb-4 text-slate-700" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[9px]">Expediente técnico sin entradas previas</p>
                  </div>
                ) : (
                  client.treatmentHistory.map(record => (
                    <div key={record.id} className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-white/5 hover:border-[#D4AF37]/20 transition-all group bg-white/[0.01]">
                       <div className="flex flex-col lg:flex-row justify-between items-start gap-6 lg:gap-10">
                          <div className="flex gap-4 sm:gap-6 items-start">
                             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl flex items-center justify-center shrink-0 border border-[#D4AF37]/10 group-hover:scale-105 transition-transform">
                                <Activity size={20} />
                             </div>
                             <div>
                                <h4 className="font-extrabold text-lg sm:text-xl text-white tracking-tight uppercase group-hover:text-[#D4AF37] transition-colors leading-snug">{record.serviceName}</h4>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1.5">
                                    <p className="text-[9px] text-[#D4AF37] font-black uppercase tracking-wider flex items-center gap-1.5">
                                        <Calendar size={11} /> {new Date(record.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                    <div className="hidden xs:block w-0.5 h-0.5 rounded-full bg-slate-800" />
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Artista: {record.professionalName}</p>
                                </div>
                             </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                             {record.pigmentsUsed && <span className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-wider">Pigmentos: {record.pigmentsUsed}</span>}
                             {record.needleType && <span className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-wider">Needle: {record.needleType}</span>}
                          </div>
                       </div>
                       
                       <div className="mt-5 p-4 sm:p-5 bg-black/40 rounded-xl border border-white/5">
                          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed italic font-medium">"{record.notes}"</p>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: CLINICAL (BIOMETRY) */}
          {activeTab === 'CLINICAL' && (
            <div className="animate-entrance space-y-8 max-w-4xl mx-auto">
               <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">Perfil Biométrico</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Datos anatómicos y restricciones clínicas</p>
                  </div>
                  {!isEditingClinical ? (
                    <button onClick={() => setIsEditingClinical(true)} className="flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black text-[#D4AF37] uppercase tracking-wider border border-[#D4AF37]/30 px-5 py-2.5 rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all self-start sm:self-auto">Actualizar Ficha</button>
                  ) : (
                    <div className="flex gap-4">
                        <button onClick={() => setIsEditingClinical(false)} className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-wider">Cancelar</button>
                        <button onClick={handleSaveClinical} className="flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black text-black bg-[#D4AF37] uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xl"><Save size={12}/> Guardar</button>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                      <h4 className="text-[10px] sm:text-[11px] font-black text-[#D4AF37] uppercase tracking-wider mb-6 flex items-center gap-2.5"><Activity size={14}/> Clasificación Dermatológica</h4>
                      <div className="space-y-6">
                         <div>
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider mb-1.5 block">Tipo de Piel (Escala Fitzpatrick)</label>
                            {isEditingClinical ? (
                                <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs" value={tempClientData.skinType} onChange={e => setTempClientData({...tempClientData, skinType: e.target.value})} />
                            ) : (
                                <p className="text-lg font-black text-white uppercase tracking-tight">{client.skinType || 'Sin Clasificar'}</p>
                            )}
                         </div>
                         <div>
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider mb-1.5 block">Alergias Conocidas</label>
                            {isEditingClinical ? (
                                <input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs" value={tempClientData.allergies} onChange={e => setTempClientData({...tempClientData, allergies: e.target.value})} />
                            ) : (
                                <p className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${client.allergies ? 'text-rose-500' : 'text-emerald-500'}`}>{client.allergies || 'Ninguna Restricción Detectada'}</p>
                            )}
                         </div>
                      </div>
                  </div>

                  <div className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                      <h4 className="text-[10px] sm:text-[11px] font-black text-[#D4AF37] uppercase tracking-wider mb-6 flex items-center gap-2.5"><ShieldAlert size={14}/> Historial Médico</h4>
                      <div className="space-y-6">
                         <div>
                            <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider mb-1.5 block">Condiciones / Medicación</label>
                            {isEditingClinical ? (
                                <textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs resize-none" rows={3} value={tempClientData.medicalConditions} onChange={e => setTempClientData({...tempClientData, medicalConditions: e.target.value})} />
                            ) : (
                                <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">{client.medicalConditions || 'No se reportan condiciones especiales de salud.'}</p>
                            )}
                         </div>
                         <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                            <div className="p-2 bg-[#D4AF37]/10 rounded-xl text-[#D4AF37] shrink-0"><Info size={14}/></div>
                            <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">Información reservada bajo protocolos de confidencialidad Aurum HIPAA.</p>
                         </div>
                      </div>
                  </div>
               </div>
            </div>
          )}

          {/* TAB: DIAGNOSIS (LASH DIAGNOSIS) */}
          {activeTab === 'DIAGNOSIS' && (
            <div className="animate-entrance space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">Ficha Técnica de Pestañas</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Diagnóstico y consentimiento de salud integral</p>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const selfLink = `${window.location.origin}/diagnostico/${client.id}`;
                    navigator.clipboard.writeText(selfLink);
                    toast.success("Enlace de autollenado copiado. Envíalo al cliente por WhatsApp.");
                  }}
                  className="bg-white/5 text-slate-400 hover:text-white border border-white/5 hover:border-white/10 px-5 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl self-start sm:self-auto"
                >
                  <Sparkles size={14} /> Compartir Ficha
                </button>
              </div>

              <LashDiagnosisForm 
                clientId={client.id}
                initialData={client.lashDiagnosis}
                onSave={async (updatedDiagnosis) => {
                  try {
                    const success = await api.updateClient({
                      ...client,
                      lashDiagnosis: updatedDiagnosis
                    });
                    if (success) {
                      onUpdateClient({
                        ...client,
                        lashDiagnosis: updatedDiagnosis
                      });
                      toast.success("Ficha de pestañas guardada correctamente");
                    } else {
                      toast.error("Error al guardar la ficha técnica");
                    }
                  } catch (err) {
                    toast.error("Error al guardar la ficha técnica");
                  }
                }}
              />
            </div>
          )}

          {/* TAB: GALLERY (NEW) */}
          {activeTab === 'GALLERY' && (
            <div className="animate-entrance space-y-8">
               <div className="flex justify-between items-center gap-4">
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter">Evolución Visual</h3>
                  <button className="gold-btn px-5 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-xl">
                    <Camera size={14} /> Añadir Evidencia
                  </button>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                  {[1,2,3].map(i => (
                    <div key={i} className="group relative aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-[#D4AF37]/30 transition-all">
                       <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all" />
                       <div className="absolute bottom-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <p className="text-[8px] font-black text-white uppercase tracking-wider mb-0.5">Sesión #{4-i}</p>
                          <p className="text-[9px] font-black text-[#D4AF37] uppercase">Antes / Después</p>
                       </div>
                       <div className="flex items-center justify-center h-full opacity-10 group-hover:opacity-100 transition-opacity">
                          <Eye size={36} className="text-slate-700" />
                       </div>
                    </div>
                  ))}
                  <div className="aspect-square bg-black border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                     <Plus size={24} className="text-slate-600" />
                     <p className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-wider">Subir Imagen</p>
                  </div>
               </div>
            </div>
          )}

          {/* TAB: AI ANALYSIS */}
          {activeTab === 'AI' && (
            <div className="animate-entrance space-y-6 max-w-3xl mx-auto">
               <div className="glass-card p-6 sm:p-8 md:p-10 rounded-[1.5rem] border-[#D4AF37]/10 bg-gradient-to-tr from-black to-[#050505] relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[80px]" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.3)] shrink-0">
                          <Wand2 size={24} className="text-black" />
                        </div>
                        <div>
                          <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter">Consultoría AI <span className="text-[#D4AF37] font-light italic">Master</span></h4>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Análisis predictivo de evolución cutánea y retención folicular</p>
                        </div>
                    </div>

                    {isAnalyzing ? (
                        <div className="py-12 text-center space-y-4">
                           <Loader2 className="animate-spin text-[#D4AF37] mx-auto" size={36} />
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando red neuronal con historial clínico...</p>
                        </div>
                    ) : aiAnalysis ? (
                        <div className="space-y-6">
                            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-5 sm:p-6 md:p-8 rounded-[1.25rem] relative">
                                <p className="text-lg sm:text-xl font-light text-slate-200 leading-relaxed italic tracking-tight">"{aiAnalysis}"</p>
                                <Info className="absolute top-6 right-6 text-[#D4AF37]/20" size={18} />
                            </div>
                            <div className="flex justify-center">
                                <button onClick={handleRunAIAnalysis} className="text-[9px] font-black text-[#D4AF37] uppercase tracking-wider border-b border-[#D4AF37]/20 pb-1.5 hover:text-white transition-colors">Solicitar Nueva Predicción</button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                           <p className="text-slate-600 font-black uppercase tracking-wider text-[9px] mb-6">Sin veredicto activo en este nodo</p>
                           <button onClick={handleRunAIAnalysis} className="gold-btn px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-2xl">Iniciar Diagnóstico AI</button>
                        </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {/* TAB: LEGAL (COMPLIANCE) */}
          {activeTab === 'LEGAL' && (
            <div className="animate-entrance space-y-8 max-w-5xl mx-auto">
               <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
                  <div className="flex-1 glass-card p-6 sm:p-8 md:p-10 rounded-[1.5rem] border-white/5 bg-gradient-to-tr from-[#050505] to-black flex flex-col items-center text-center">
                      <div className={`w-20 h-20 rounded-2xl border flex items-center justify-center mb-6 shadow-2xl transition-all duration-700 ${client.consentAccepted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 scale-105' : 'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse'}`}>
                         {client.consentAccepted ? <ShieldCheck size={36} /> : <Scale size={36} />}
                      </div>
                      <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter mb-2">
                        {client.consentAccepted ? 'Socio Protegido' : 'Cumplimiento Pendiente'}
                      </h4>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-[280px] mb-8">
                        {client.consentAccepted 
                          ? `Protocolo de seguridad firmado el ${new Date(client.consentDate!).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}. Autorizado para todos los servicios máster.`
                          : 'Este socio requiere la firma del deslinde de responsabilidad y el consentimiento antes de cualquier intervención.'}
                      </p>
                      
                      {!client.consentAccepted ? (
                        <button 
                          onClick={() => setIsConsentModalOpen(true)}
                          className="gold-btn w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-2xl flex items-center justify-center gap-3"
                        >
                          <Scissors size={14} /> Firmar Consentimiento
                        </button>
                      ) : (
                        <button className="bg-white/5 text-slate-400 w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-wider border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-3 shadow-xl">
                           <Download size={16} /> Certificado de Conformidad
                        </button>
                      )}
                  </div>

                  <div className="flex-1 space-y-6">
                     <div className="glass-card p-5 sm:p-6 md:p-8 rounded-[1.5rem] border-white/5 bg-black/20">
                        <h5 className="text-[10px] sm:text-[11px] font-black text-[#D4AF37] uppercase tracking-wider mb-4 flex items-center gap-2.5"><Info size={14}/> Registro de Auditoría</h5>
                        <div className="space-y-4">
                           <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold uppercase tracking-wider">Estatus Legal:</span><span className={client.consentAccepted ? 'text-emerald-500 font-black' : 'text-rose-500 font-black'}>{client.consentAccepted ? 'VERIFICADO' : 'PENDIENTE'}</span></div>
                           <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold uppercase tracking-wider">Tipo Protocolo:</span><span className="text-white font-black">{client.consentType || 'N/A'}</span></div>
                           <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold uppercase tracking-wider">Firma Hash:</span><span className="text-white font-mono text-[9px] font-black opacity-40">{client.consentAccepted ? '8888-AUM-777-SEC' : 'PENDING_VALIDATION'}</span></div>
                           <div className="flex justify-between text-xs"><span className="text-slate-500 font-bold uppercase tracking-wider">Timestamp:</span><span className="text-white font-black">{client.consentDate ? new Date(client.consentDate).toLocaleTimeString() : 'N/A'}</span></div>
                        </div>
                     </div>
                     <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 p-5 sm:p-6 rounded-[1.5rem]">
                        <p className="text-[9px] text-slate-500 font-black leading-relaxed uppercase tracking-wider text-center italic">
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


      </div>
    </div>
  );
};
