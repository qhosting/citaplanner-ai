
import React from 'react';
import { Link } from 'react-router-dom';
import { Map, ArrowLeft, Sparkles, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#CE4676]/10 blur-[150px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/10 blur-[150px] rounded-full -z-10" />
      
      <div className="max-w-2xl w-full text-center space-y-12 animate-entrance">
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-2xl relative group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#CE4676]/20 to-[#D4AF37]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <Map className="text-zinc-500 group-hover:text-white transition-colors relative z-10" size={48} />
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center shadow-2xl animate-bounce">
             <Sparkles className="text-[#D4AF37]" size={20} />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-7xl font-black text-white tracking-tighter uppercase leading-none">404</h1>
          <h2 className="text-xl font-bold text-zinc-400 uppercase tracking-[0.3em]">Nodo No Encontrado</h2>
          <div className="w-20 h-1 bg-gradient-to-r from-transparent via-[#CE4676] to-transparent mx-auto mt-6" />
        </div>

        <p className="text-zinc-500 font-medium leading-relaxed max-w-md mx-auto text-sm">
          Parece que has intentado acceder a una zona de la red que no existe o ha sido reubicada. 
          Nuestra IA no ha podido localizar este enlace.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <Link 
            to="/" 
            className="px-10 py-5 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-white transition-all shadow-2xl flex items-center gap-3 active:scale-95"
          >
            <Home size={16} /> Regresar al Inicio
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 active:scale-95"
          >
            <ArrowLeft size={16} /> Volver Atrás
          </button>
        </div>

        <div className="pt-20">
          <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.5em]">CitaPlanner Suite • Error Protocol 404</p>
        </div>
      </div>
    </div>
  );
};
