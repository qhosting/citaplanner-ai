
import React from 'react';
import { Link2, BrainCircuit, MessageSquare } from 'lucide-react';

interface IntegrationLog {
    platform: string;
    event_type: string;
    response: string;
    created_at: string;
}

interface SystemMonitorProps {
    logs: IntegrationLog[];
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({ logs }) => {
    return (
        <div className="glass-card rounded-[3.5rem] p-10 relative overflow-hidden group border border-emerald-500/10 h-full">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-[80px]" />
            <h3 className="font-black text-[10px] uppercase tracking-[0.5em] mb-10 flex items-center gap-3 text-main">
                <Link2 size={20} className="text-emerald-500" /> Monitor de Integraciones
            </h3>
            <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {logs.map((log, idx) => (
                    <div key={idx} className="p-5 bg-black/5 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                {log.event_type.includes('AI') ? (
                                    <BrainCircuit size={16} className="text-[#D4AF37]" />
                                ) : (
                                    <MessageSquare size={16} className="text-emerald-500" />
                                )}
                                <span className="text-[9px] font-black text-white dark:text-white uppercase tracking-widest">{log.platform}</span>
                            </div>
                            <span className="text-[8px] text-muted font-bold">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tight mb-2">
                            {log.event_type.replace(/_/g, ' ')}
                        </p>
                        <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-300 italic leading-relaxed">"{log.response || 'Sincronización OK'}"</p>
                        </div>
                    </div>
                ))}
                {logs.length === 0 && (
                    <p className="text-center text-muted text-[10px] font-black uppercase py-20">
                        Escaneando red de integraciones...
                    </p>
                )}
            </div>
        </div>
    );
};
