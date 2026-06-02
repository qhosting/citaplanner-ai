
import React, { useState, useEffect } from 'react';
import {
    ClipboardList, Plus, Trash2, Calendar, CheckCircle2,
    Circle, AlertCircle, Sparkles, Filter, ChevronRight,
    ShieldCheck, ArrowRight, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

interface MaintenanceTask {
    id: string;
    dayOfWeek: number;
    taskName: string;
    priority: number;
}

const DAYS = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export const MaintenancePage: React.FC = () => {
    const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(new Date().getDay());
    const [newTaskName, setNewTaskName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const data = await api.getMaintenanceTasks();
            setTasks(data);
        } catch (e) {
            toast.error("Error al cargar el plan de mantenimiento.");
        } finally {
            setLoading(false);
        }
    };

    const addTask = async () => {
        if (!newTaskName.trim()) return;
        setIsAdding(true);
        try {
            const newTask = await api.createMaintenanceTask({
                dayOfWeek: selectedDay,
                taskName: newTaskName,
                priority: tasks.filter(t => t.dayOfWeek === selectedDay).length + 1
            });
            if (newTask) {
                setTasks(prev => [...prev, newTask]);
                setNewTaskName('');
                toast.success("Tarea integrada al protocolo maestro.");
            } else {
                throw new Error("Failed to create task");
            }
        } catch (e) {
            toast.error("Error al guardar tarea.");
        } finally {
            setIsAdding(false);
        }
    };

    const deleteTask = async (id: string) => {
        try {
            const success = await api.deleteMaintenanceTask(id);
            if (success) {
                setTasks(prev => prev.filter(t => t.id !== id));
                toast.success("Tarea eliminada del protocolo.");
            } else {
                throw new Error("Failed to delete");
            }
        } catch (e) {
            toast.error("Error al eliminar.");
        }
    };

    const filteredTasks = tasks.filter(t => t.dayOfWeek === selectedDay);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-black">
                <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-16 animate-entrance">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-8">
                <div>
                    {/* operational tracking and intelligence */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/[0.02] rounded-2xl text-[#D4AF37] border border-white/5">
                            <ShieldCheck size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500">MMS <span className="text-[#D4AF37]">Operational</span></span>
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">Protocolo de <br /> <span className="gold-text-gradient">Limpieza</span></h1>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-4 font-semibold">Gestión Inteligente de Higiene y Mantenimiento de CitaPlanner</p>
                </div>

                <div className="flex items-center gap-4 p-2 bg-black/40 rounded-[2rem] border border-white/5">
                    {DAYS.map((day, idx) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(idx)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedDay === idx
                                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black shadow-lg shadow-[#D4AF37]/20 border-transparent'
                                    : 'text-zinc-500 hover:text-white'
                                }`}
                        >
                            {day.substring(0, 3)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Task List */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex justify-between items-end mb-8">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <ClipboardList size={24} className="text-[#D4AF37]" /> {DAYS[selectedDay]}
                        </h2>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">{filteredTasks.length} Tareas Definidas</span>
                    </div>

                    {filteredTasks.length === 0 ? (
                        <div className="bg-card-theme rounded-[3rem] p-24 border border-dashed border-theme flex flex-col items-center justify-center text-center group">
                            <div className="w-20 h-20 bg-input-theme rounded-full flex items-center justify-center mb-8 text-muted group-hover:scale-110 transition-transform">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-main font-black text-lg uppercase mb-2">Protocolo Vacío</h3>
                            <p className="text-muted text-[11px] font-medium max-w-xs">No hay tareas configuradas para este día. Agrega la primera para iniciar la automatización.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredTasks.map((task, idx) => (
                                <div key={task.id} className="group bg-black/40 rounded-[2rem] p-6 border border-white/5 hover:border-[#D4AF37]/20 transition-all flex items-center justify-between shadow-sm hover:shadow-xl">
                                    <div className="flex items-center gap-6">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-[13px] uppercase tracking-tight group-hover:text-[#D4AF37] transition-colors">{task.taskName}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/40" />
                                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Prioridad {task.priority}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Panel */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-black/40 rounded-[3rem] p-10 border border-white/5 shadow-lg relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/5 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <h3 className="font-black text-[10px] text-zinc-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                                <Plus size={18} className="text-[#D4AF37]" /> Nueva Tarea Maestra
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 ml-2">Nombre de Actividad</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Barrer y Trapear"
                                        className="w-full bg-black border border-white/5 rounded-2xl p-5 text-[12px] font-bold outline-none focus:border-[#D4AF37] text-white transition-all"
                                        value={newTaskName}
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                    />
                                </div>

                                <button
                                    onClick={addTask}
                                    disabled={isAdding || !newTaskName.trim()}
                                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-lg shadow-[#D4AF37]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isAdding ? <Loader2 className="animate-spin text-black" size={18} /> : (
                                        <>
                                            <Sparkles size={18} /> Integrar Tarea
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-tr from-[#D4AF37] to-[#AA7C11] rounded-[3rem] p-10 text-black shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20"><Calendar size={120} /></div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-75">Operativa Smart</h4>
                            <p className="text-2xl font-black leading-tight uppercase tracking-tighter">
                                Asignación Inteligente
                                <br /> Equitativa
                            </p>
                            <p className="mt-6 text-[10px] font-medium leading-relaxed opacity-75">
                                El sistema distribuirá estas tareas automáticamente entre el personal activo cada día a las 6:00 AM vía WhatsApp.
                            </p>
                            <div className="mt-10 flex items-center gap-2 group cursor-pointer font-black uppercase text-[9px] tracking-widest">
                                <span>Ver reportes de hoy</span>
                                <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
