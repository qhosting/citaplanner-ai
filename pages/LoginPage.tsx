import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Phone, ArrowRight, Loader2, Sparkles, ShieldCheck, Globe, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth(); // Importamos user e isAuthenticated
  const navigate = useNavigate();

  // EFECTO DE REDIRECCIÓN AUTOMÁTICA
  useEffect(() => {
    if (isAuthenticated && user) {
        if(user.role === 'ADMIN') navigate('/admin');
        else if(user.role === 'PROFESSIONAL') navigate('/professional-dashboard');
        else if(user.role === 'CLIENT') navigate('/client-portal');
        else navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(phone, password);
      // Ya no navegamos aquí manualmente. El useEffect se encarga.
      if (!success) {
        setError('Acceso denegado. Credenciales no autorizadas.');
      }
    } catch (err) {
      setError('Falla crítica en la infraestructura Aurum.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0a0a0a]">
      
      {/* 11 Satellites Network Simulation (Abstract Representation) */}
      <div className="absolute inset-0 pointer-events-none">
         {[...Array(11)].map((_, i) => (
           <div 
            key={i}
            className="absolute satellite-node"
            style={{
              top: `${Math.random() * 90 + 5}%`,
              left: `${Math.random() * 90 + 5}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
           >
             <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
             <div className="absolute -inset-10 bg-[radial-gradient(circle,rgba(212,175,55,0.03)_0%,transparent_70%)] rounded-full" />
           </div>
         ))}
      </div>

      <div className="w-full max-w-lg z-10 animate-fade-in-up">
        <div className="glass-card p-10 md:p-14 rounded-[3.5rem] relative">
          
          <div className="flex flex-col items-center mb-12">
            <div className="mb-4">
               <div className="w-20 h-20 rounded-[2rem] border-2 border-[#D4AF37]/30 flex items-center justify-center bg-black/40 shadow-2xl relative group overflow-hidden">
                  <Sparkles className="text-[#D4AF37] group-hover:scale-125 transition-transform duration-500" size={36} />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/10 to-transparent" />
               </div>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase flex items-center gap-2">
              Cita<span className="gold-text-gradient">Planner</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-2">Elite Business Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Identidad de Operación</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#D4AF37] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin / dev"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl outline-none transition-all font-medium text-white gold-focus placeholder-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Bóveda de Seguridad</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#D4AF37] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl outline-none transition-all font-medium text-white gold-focus placeholder-slate-700"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-[11px] font-black uppercase tracking-widest bg-red-950/20 p-4 rounded-2xl border border-red-900/30 text-center">
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                id="login-btn-71427321893"
                type="submit"
                disabled={loading}
                className="w-full gold-btn py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 disabled:opacity-50 shadow-lg active:scale-95"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Iniciar Sesión <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="mt-8 text-center">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                  A strategic solution by <a href="https://aurumcapital.mx" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">Aurum Capital</a>
                </p>
              </div>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 px-5 py-2 bg-white/5 rounded-full border border-white/5 shadow-inner">
                <ShieldCheck className="text-[#D4AF37]" size={14} />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Secured by Aurum Infrastructure</span>
             </div>
             <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.1em]">© 2026 CitaPlanner Global Ecosystem</p>
          </div>
        </div>
      </div>
    </div>
  );
};