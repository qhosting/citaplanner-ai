
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowRight, Loader2, Sparkles, ShieldCheck, Mail, ShieldAlert } from 'lucide-react';
import { Role } from '../types';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.getLandingSettings().then(s => setIsMaintenance(!!s.maintenanceMode));
  }, []);

  const handleRedirection = (role: Role) => {
    if (role === 'SUPERADMIN') navigate('/nexus', { replace: true });
    else if (role === 'ADMIN') navigate('/admin', { replace: true });
    else if (role === 'PROFESSIONAL') navigate('/professional-dashboard', { replace: true });
    else if (role === 'CLIENT') navigate('/client-portal', { replace: true });
    else navigate('/', { replace: true });
  };

  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      handleRedirection(user.role);
    }
  }, [isAuthenticated, user, navigate, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUser = await login(phone, password);
      if (apiUser) {
        if (isMaintenance && apiUser.role === 'CLIENT') {
          setError('PROTOCOLO DE MANTENIMIENTO: Acceso restringido.');
          return;
        }
        handleRedirection(apiUser.role);
      } else {
        setError('Acceso denegado. Credenciales inválidas.');
      }
    } catch (err) {
      setError('Falla crítica en la infraestructura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#050505]">
      {/* Background Nodes */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
         {[...Array(8)].map((_, i) => (
           <div 
            key={i}
            className="absolute satellite-node"
            style={{
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + Math.random() * 5}s`
            }}
           >
             <div className="w-1 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(212,175,55,0.6)]" />
           </div>
         ))}
      </div>

      <div className="w-full max-w-md z-10 animate-entrance">
        <div className="glass-card p-8 md:p-10 rounded-[2.5rem] relative border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {isMaintenance && (
             <div className="mb-8 p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl flex items-center gap-3">
                <ShieldAlert className="text-[#D4AF37] shrink-0" size={18} />
                <p className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest leading-tight">Mantenimiento Activo. <br/>Solo personal autorizado.</p>
             </div>
          )}

          <div className="flex flex-col items-center mb-10">
            <div className="mb-4">
               <div className="w-16 h-16 rounded-[1.5rem] border border-[#D4AF37]/30 flex items-center justify-center bg-black/40 shadow-xl relative group overflow-hidden">
                  <Sparkles className="text-[#D4AF37] group-hover:scale-110 transition-transform duration-500" size={28} />
               </div>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase flex items-center gap-2">
              Cita<span className="gold-text-gradient font-light">Planner</span>
            </h1>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.6em] mt-1.5 opacity-60">Elite Business Login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Identidad</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#D4AF37] transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="ID de Acceso"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-[#D4AF37]/40 transition-all font-medium text-white text-sm placeholder-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Bóveda</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#D4AF37] transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-[#D4AF37]/40 transition-all font-medium text-white text-sm placeholder-slate-700"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-950/20 p-3 rounded-lg border border-red-900/20 text-center">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full gold-btn py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <>Entrar <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
                <ShieldCheck className="text-[#D4AF37]" size={12} />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Aurum Core Secured</span>
             </div>
             <p className="text-[8px] text-zinc-800 font-bold uppercase tracking-widest">© 2026 CitaPlanner Infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  );
};
