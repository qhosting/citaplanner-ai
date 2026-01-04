
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User as UserIcon, Lock, Save, ShieldCheck, Bell, MessageSquare, MessageCircle,
  Smartphone, Mail, Check, Camera, Loader2, Zap, Fingerprint, Globe, ShieldAlert, Upload
} from 'lucide-react';
import { api } from '../services/api';
import { NotificationPreferences } from '../types';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { user, updatePassword } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({ name: '', email: '', avatar: '' });
  const [identityLoading, setIdentityLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    whatsapp: true,
    sms: true,
    email: true
  });
  const [prefLoading, setPrefLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email || '',
        avatar: user.avatar || ''
      });
      if (user.preferences) {
        setPreferences(user.preferences);
      }
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const url = await api.uploadImage(file);
    if (url) {
      setProfileData(prev => ({ ...prev, avatar: url }));
      toast.success("Imagen cargada exitosamente.");
    } else {
      toast.error("Error al subir la imagen.");
    }
    setUploading(false);
  };

  const handleUpdateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIdentityLoading(true);
    const success = await api.updateProfile(user.id, profileData);
    setIdentityLoading(false);
    if (success) toast.success("Identidad Aurum sincronizada correctamente.");
    else toast.error("Fallo en la actualización de identidad.");
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      toast.error("Las claves de seguridad no coinciden.");
      return;
    }
    setPassLoading(true);
    try {
      const success = await updatePassword(passData.current, passData.new);
      if (success) {
        toast.success("Bóveda de seguridad actualizada.");
        setPassData({ current: '', new: '', confirm: '' });
      } else {
        toast.error("Error al validar clave actual.");
      }
    } catch (e) {
      toast.error("Error de red en la infraestructura.");
    } finally {
      setPassLoading(false);
    }
  };

  const handlePreferencesSave = async () => {
    if (!user) return;
    setPrefLoading(true);
    try {
      const success = await api.updatePreferences(user.id, preferences);
      if (success) toast.success("Protocolos de notificación actualizados.");
    } catch (e) {
      toast.error("Error de sincronización.");
    } finally {
      setPrefLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 animate-entrance">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
        <div>
          <div className="flex items-center gap-4 mb-3">
             <div className="w-1 h-10 bg-[#D4AF37] rounded-full shadow-[0_0_20px_#D4AF37]"></div>
             <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                User <span className="gold-text-gradient font-light">Identity</span>
             </h1>
          </div>
          <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px] ml-5">Master Profile • Aurum Governance Node</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-10 rounded-[3.5rem] border-white/5 bg-gradient-to-b from-white/5 to-transparent text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <Zap size={120} />
            </div>
            
            <div className="relative mb-8 inline-block">
              <div className="w-40 h-40 rounded-full border-2 border-[#D4AF37]/30 p-2 bg-black shadow-2xl relative overflow-hidden">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center text-5xl font-black text-[#D4AF37]">
                    {user.name.charAt(0)}
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
                  </div>
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 bg-[#D4AF37] text-black p-3 rounded-full shadow-xl hover:scale-110 transition-all border-4 border-[#050505]"
                >
                  <Camera size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="input-file-hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-1">{user.name}</h2>
            <div className="flex items-center justify-center gap-2 mb-8">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">{user.role}</p>
            </div>
            
            <div className="space-y-4 pt-8 border-t border-white/5">
              <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                <Smartphone size={16} className="text-slate-500" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">{user.phone}</span>
              </div>
              <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                <Mail size={16} className="text-slate-500" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest truncate">{user.email || 'Sin correo registrado'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-10 rounded-[3.5rem] bg-[#D4AF37]/5 border-[#D4AF37]/10">
             <div className="flex items-center gap-4 mb-6">
                <ShieldCheck className="text-[#D4AF37]" size={24} />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Nivel de Acceso</h3>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed font-medium">Su cuenta está protegida por el protocolo de alta seguridad Aurum. Actualmente opera desde un <b>Nodo Certificado</b>.</p>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-12">
          <section className="glass-card p-12 rounded-[3.5rem] border-white/5">
             <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-4">
                <UserIcon className="text-[#D4AF37]" size={24} /> Gestión de Identidad
             </h3>
             <form onSubmit={handleUpdateIdentity} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Nombre Completo de Operación</label>
                      <input 
                        type="text" value={profileData.name} 
                        onChange={e => setProfileData({...profileData, name: e.target.value})}
                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white outline-none focus:border-[#D4AF37] font-bold transition-all" 
                      />
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Email Institucional</label>
                      <input 
                        type="email" value={profileData.email} 
                        onChange={e => setProfileData({...profileData, email: e.target.value})}
                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white outline-none focus:border-[#D4AF37] font-bold transition-all" 
                      />
                   </div>
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Avatar URL (Imagen Master)</label>
                   <div className="relative">
                    <textarea 
                      rows={5}
                      value={profileData.avatar} 
                      onChange={e => setProfileData({...profileData, avatar: e.target.value})}
                      className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white outline-none focus:border-[#D4AF37] font-medium text-xs resize-none"
                      placeholder="https://..."
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-4 right-4 bg-white/5 p-2 rounded-lg text-slate-500 hover:text-[#D4AF37] transition-all"
                    >
                      <Upload size={14} />
                    </button>
                   </div>
                </div>
                <div className="md:col-span-2 flex justify-end pt-4">
                   <button 
                    disabled={identityLoading}
                    className="gold-btn px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 disabled:opacity-50"
                   >
                     {identityLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                     Actualizar Identidad
                   </button>
                </div>
             </form>
          </section>

          <section className="glass-card p-12 rounded-[3.5rem] border-white/5">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-10 flex items-center gap-4">
                <Bell className="text-[#D4AF37]" size={24} /> Protocolos de Notificación
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-500' },
                  { id: 'sms', label: 'Mensajería SMS', icon: Smartphone, color: 'text-blue-500' },
                  { id: 'email', label: 'E-mail Corporativo', icon: Mail, color: 'text-[#D4AF37]' }
                ].map(pref => (
                  <div key={pref.id} className="p-8 bg-black/40 border border-white/5 rounded-3xl group hover:border-[#D4AF37]/20 transition-all flex flex-col items-center text-center gap-6">
                    <div className={`p-4 rounded-2xl bg-white/5 ${pref.color} group-hover:scale-110 transition-transform`}>
                       <pref.icon size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{pref.label}</p>
                      <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Estado: {preferences[pref.id as keyof NotificationPreferences] ? 'ACTIVO' : 'STANDBY'}</p>
                    </div>
                    <button 
                      onClick={() => setPreferences({...preferences, [pref.id]: !preferences[pref.id as keyof NotificationPreferences]})}
                      className={`w-14 h-7 rounded-full transition-all relative ${preferences[pref.id as keyof NotificationPreferences] ? 'bg-[#D4AF37]' : 'bg-slate-800'}`}
                    >
                       <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-xl ${preferences[pref.id as keyof NotificationPreferences] ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
             </div>
             <div className="mt-10 flex justify-end">
                <button 
                  onClick={handlePreferencesSave}
                  disabled={prefLoading}
                  className="bg-white/5 text-slate-400 px-10 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-white/5 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3"
                >
                  {prefLoading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                  Sincronizar Canales
                </button>
             </div>
          </section>

          <section className="glass-card p-12 rounded-[3.5rem] border-white/5 bg-gradient-to-tr from-black to-red-950/5">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                    <Fingerprint className="text-rose-500" size={24} /> Bóveda de Seguridad
                </h3>
                <span className="flex items-center gap-2 text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                   <ShieldCheck size={12} /> Cifrado AES-256 Activo
                </span>
             </div>
             
             <form onSubmit={handlePasswordChange} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div>
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">Clave Actual</label>
                      <input 
                        type="password" required value={passData.current} 
                        onChange={e => setPassData({...passData, current: e.target.value})}
                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white outline-none focus:border-rose-500 transition-all font-mono" 
                      />
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">Nueva Clave Maestro</label>
                      <input 
                        type="password" required value={passData.new} 
                        onChange={e => setPassData({...passData, new: e.target.value})}
                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white outline-none focus:border-[#D4AF37] transition-all font-mono" 
                      />
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1">Confirmar Bóveda</label>
                      <input 
                        type="password" required value={passData.confirm} 
                        onChange={e => setPassData({...passData, confirm: e.target.value})}
                        className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-white outline-none focus:border-[#D4AF37] transition-all font-mono" 
                      />
                   </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-white/5">
                   <div className="flex items-center gap-4">
                      <ShieldAlert className="text-slate-700" size={20} />
                      <p className="text-[8px] text-slate-700 font-bold uppercase tracking-[0.2em] max-w-sm leading-relaxed">Al cambiar su clave de seguridad, todas las sesiones activas en otros nodos podrían ser invalidadas por protocolo de protección.</p>
                   </div>
                   <button 
                    disabled={passLoading}
                    className="w-full md:w-auto bg-rose-500/10 text-rose-500 px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3 border border-rose-500/20"
                   >
                     {passLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                     Reforzar Bóveda
                   </button>
                </div>
             </form>
          </section>

        </div>
      </div>
    </div>
  );
};
