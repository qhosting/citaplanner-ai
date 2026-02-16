
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, User } from 'lucide-react';
import { Appointment } from '../../types';

interface OperationsAgendaProps {
    appointments: Appointment[];
}

export const OperationsAgenda: React.FC<OperationsAgendaProps> = ({ appointments }) => {
    const navigate = useNavigate();

    return (
        <section>
            <div className="flex justify-between items-center mb-10 px-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4 text-main">
                    <CalendarIcon className="text-[#CE4676]" size={28} /> Agenda de Operaciones
                </h2>
                <button
                    onClick={() => navigate('/schedules')}
                    className="text-[9px] font-black uppercase tracking-[0.3em] text-muted hover:text-[#CE4676] transition-all"
                >
                    Ver Matriz Completa
                </button>
            </div>

            <div className="space-y-6">
                {appointments.length === 0 ? (
                    <div className="text-center py-24 glass-card rounded-[3.5rem] border-dashed border-theme bg-card-theme">
                        <p className="text-muted font-bold uppercase tracking-[0.3em] text-[10px]">
                            Esperando sincronización de datos...
                        </p>
                    </div>
                ) : (
                    appointments.map((apt) => (
                        <div
                            key={apt.id}
                            className="glass-card p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col sm:flex-row gap-6 md:gap-10 items-center group relative overflow-hidden transition-all hover:scale-[1.02] border border-theme bg-card-theme"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#CE4676]" />
                            <div className="flex-grow">
                                <h3 className="font-black text-xl md:text-2xl tracking-tight text-main">{apt.title}</h3>
                                <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-1">{apt.clientName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-[#CE4676]">
                                    {new Date(apt.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};
