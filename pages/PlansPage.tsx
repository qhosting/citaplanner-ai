
import React, { useState, useEffect } from "react";
import { Check, Loader2, Sparkles, Zap, Shield, Crown } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { SaasPlan } from "../types";

export const PlansPage: React.FC = () => {
    const [plans, setPlans] = useState<SaasPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState<string | null>(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const data = await api.getSaasPlans();
            setPlans(data);
        } catch (e) {
            toast.error("Error al cargar planes");
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId: string) => {
        setSubscribing(planId);
        try {
            const response = await api.subscribeToPlan(planId);
            if (response.init_point) {
                window.location.href = response.init_point;
            } else {
                toast.error("Error al iniciar suscripción");
            }
        } catch (e) {
            toast.error("Error de conexión");
        } finally {
            setSubscribing(null);
        }
    };

    const getIcon = (planId: string) => {
        if (planId === "BASIC") return <Zap className="text-emerald-400" size={32} />;
        if (planId === "PRO") return <Shield className="text-blue-400" size={32} />;
        return <Crown className="text-[#D4AF37]" size={32} />;
    };

    const getGradient = (planId: string) => {
        if (planId === "BASIC") return "from-emerald-900/20 to-emerald-900/5 hover:border-emerald-500/50";
        if (planId === "PRO") return "from-blue-900/20 to-blue-900/5 hover:border-blue-500/50";
        return "from-[#D4AF37]/20 to-[#D4AF37]/5 hover:border-[#D4AF37]";
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 animate-entrance">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">
                    Potencia tu <span className="gold-text-gradient">Negocio</span>
                </h1>
                <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
                    Selecciona el nivel de inteligencia y automatización que tu empresa necesita. Escala sin límites.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative group bg-gradient-to-b ${getGradient(plan.id)} border border-white/10 rounded-[2.5rem] p-10 transition-all duration-500 hover:transform hover:-translate-y-2 hover:shadow-2xl overflow-hidden`}
                        >
                            {plan.id === "ELITE" && (
                                <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-bl-2xl">
                                    Más Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <div className="mb-6 p-4 bg-white/5 rounded-2xl w-fit border border-white/10 group-hover:bg-white/10 transition-colors">
                                    {getIcon(plan.id)}
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                                    {plan.title.split("(")[0]}
                                </h3>
                                <p className="text-slate-500 font-medium text-sm">{plan.description}</p>
                            </div>

                            <div className="mb-10">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white tracking-tighter">
                                        ${plan.price}
                                    </span>
                                    <span className="text-slate-500 font-bold text-sm uppercase">/ Mes</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-12">
                                {Object.entries(plan.features).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <div
                                            className={`p-1 rounded-full ${value ? "bg-emerald-500/20 text-emerald-500" : "bg-white/5 text-slate-600"
                                                }`}
                                        >
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        <span
                                            className={`text-sm font-bold uppercase tracking-wide ${value ? "text-zinc-300" : "text-slate-700 line-through decoration-slate-700"
                                                }`}
                                        >
                                            {key.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleSubscribe(plan.id)}
                                disabled={!!subscribing}
                                className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${plan.id === "ELITE"
                                        ? "bg-[#D4AF37] text-black hover:bg-[#F8D568] shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                                        : "bg-white text-black hover:bg-zinc-200"
                                    }`}
                            >
                                {subscribing === plan.id ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        <Sparkles size={18} /> Iniciar Suscripción
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PlansPage;
