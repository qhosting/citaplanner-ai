
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
        <div className="glass-card rounded-[3.5rem] p-10 relative overflow-hidden group border border-theme h-full bg-card-theme">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-[80px]" />
            <h3 className="font-black text-[10px] uppercase tracking-[0.5em] mb-10 flex items-center gap-3 text-main">
                <Link2 size={20} className="text-emerald-500" /> Monitor de Integraciones
            </h3>
            <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                {logs.map((log, idx) => (
                    <div key={idx} className="p-5 bg-input-theme rounded-[2rem] border border-theme transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                {(log.event_type || '').includes('AI') ? (
                                    <BrainCircuit size={16} className="text-[#CE4676]" />
                                ) : (
                                    <MessageSquare size={16} className="text-emerald-500" />
                                )}
                                <span className="text-[9px] font-black text-main uppercase tracking-widest">{log.platform}</span>
                            </div>
                            <span className="text-[8px] text-muted font-bold">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-tight mb-2">
                            {(log.event_type || '').replace(/_/g, ' ')}
                        </p>
                        <div className="p-3 bg-card-theme rounded-xl border border-theme">
                            <p className="text-[10px] text-muted italic leading-relaxed">"{log.response || 'Sincronización OK'}"</p>
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
