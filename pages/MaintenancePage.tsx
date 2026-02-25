
import React, { useState, useEffect } from 'react';
import {
    ClipboardList, Plus, Trash2, Calendar, CheckCircle2,
    Circle, AlertCircle, Sparkles, Filter, ChevronRight,
    ShieldCheck, ArrowRight, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

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
            const response = await fetch('/api/maintenance/tasks', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
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
            const response = await fetch('/api/maintenance/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    dayOfWeek: selectedDay,
                    taskName: newTaskName,
                    priority: tasks.filter(t => t.dayOfWeek === selectedDay).length + 1
                })
            });
            const newTask = await response.json();
            setTasks(prev => [...prev, newTask]);
            setNewTaskName('');
            toast.success("Tarea integrada al protocolo maestro.");
        } catch (e) {
            toast.error("Error al guardar tarea.");
        } finally {
            setIsAdding(false);
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await fetch(`/api/maintenance/tasks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setTasks(prev => prev.filter(t => t.id !== id));
            toast.success("Tarea eliminada del protocolo.");
        } catch (e) {
            toast.error("Error al eliminar.");
        }
    };

    const filteredTasks = tasks.filter(t => t.dayOfWeek === selectedDay);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-black">
                <Loader2 className="animate-spin text-[#CE4676]" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-16 animate-entrance">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-8">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-main/10 rounded-2xl text-main border border-main/10">
                            <ShieldCheck size={28} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500">MMS <span className="text-main">Operational</span></span>
                    </div>
                    <h1 className="text-6xl font-black text-main tracking-tighter uppercase leading-none">Protocolo de <br /> <span className="bugambilia-text-gradient">Limpieza</span></h1>
                    <p className="text-muted text-[10px] font-bold uppercase tracking-widest mt-4">Gestión Inteligente de Higiene y Mantenimiento de CitaPlanner</p>
                </div>

                <div className="flex items-center gap-4 p-2 bg-input-theme rounded-[2rem] border border-theme">
                    {DAYS.map((day, idx) => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(idx)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedDay === idx
                                    ? 'bg-main text-white shadow-xl'
                                    : 'text-muted hover:text-main'
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
                        <h2 className="text-2xl font-black text-main uppercase tracking-tighter flex items-center gap-3">
                            <ClipboardList size={24} className="text-main" /> {DAYS[selectedDay]}
                        </h2>
                        <span className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">{filteredTasks.length} Tareas Definidas</span>
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
                                <div key={task.id} className="group bg-card-theme rounded-[2rem] p-6 border border-theme hover:border-main/30 transition-all flex items-center justify-between shadow-sm hover:shadow-xl">
                                    <div className="flex items-center gap-6">
                                        <div className="w-10 h-10 rounded-xl bg-input-theme flex items-center justify-center text-[10px] font-black text-main group-hover:bg-main group-hover:text-white transition-colors">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-main font-bold text-[13px] uppercase tracking-tight">{task.taskName}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-main/40" />
                                                <span className="text-[8px] font-black text-muted uppercase tracking-widest">Prioridad {task.priority}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="p-3 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
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
                    <div className="bg-card-theme rounded-[3rem] p-10 border border-theme shadow-lg relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-main/5 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <h3 className="text-main font-black text-[10px] uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                                <Plus size={18} /> Nueva Tarea Maestras
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[9px] font-black text-muted uppercase tracking-widest mb-3 ml-2">Nombre de Actividad</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Barrer y Trapear"
                                        className="w-full bg-input-theme border border-theme rounded-2xl p-5 text-[12px] font-bold outline-none focus:border-main transition-all"
                                        value={newTaskName}
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                    />
                                </div>

                                <button
                                    onClick={addTask}
                                    disabled={isAdding || !newTaskName.trim()}
                                    className="w-full bg-main text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isAdding ? <Loader2 className="animate-spin" size={18} /> : (
                                        <>
                                            <Sparkles size={18} /> Integrar Tarea
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-main rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20"><Calendar size={120} /></div>
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-70">Operativa Smart</h4>
                            <p className="text-2xl font-black leading-tight uppercase tracking-tighter">
                                Asignación Inteligente
                                <br /> Equitativa
                            </p>
                            <p className="mt-6 text-[10px] font-medium leading-relaxed opacity-60">
                                El sistema distribuirá estas tareas automáticamente entre el personal activo cada día a las 6:00 AM vía WhatsApp.
                            </p>
                            <div className="mt-10 flex items-center gap-2 group cursor-pointer">
                                <span className="text-[9px] font-black uppercase tracking-widest">Ver reportes de hoy</span>
                                <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
