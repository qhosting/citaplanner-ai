import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Appointment, AppointmentStatus } from '../types';

export const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // MOCK DATA (In real app, fetch from backend filtering by user.relatedId)
  const [myAppointments] = useState<Appointment[]>([
    {
      id: '1',
      title: 'Limpieza Dental',
      startDateTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
      endDateTime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
      clientName: 'Maria Garcia',
      status: AppointmentStatus.SCHEDULED,
      description: 'Paciente regular',
      professionalId: '1' // Matches the Mock user relatedId
    },
    {
        id: '2',
        title: 'Extracción',
        startDateTime: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
        endDateTime: new Date(new Date().setHours(13, 0, 0, 0)).toISOString(),
        clientName: 'Pedro Pascal',
        status: AppointmentStatus.COMPLETED,
        description: '',
        professionalId: '1'
      }
  ]);

  const filteredAppointments = myAppointments.filter(apt => apt.professionalId === user?.relatedId);
  const today = new Date().toLocaleDateString();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Panel Profesional</h1>
        <p className="text-slate-500">Bienvenido, {user?.name}. Aquí tienes tu agenda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Agenda Column */}
        <div className="lg:col-span-2 space-y-4">
           <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
             <CalendarIcon size={20} className="text-indigo-600"/>
             Tus Citas Asignadas
           </h2>

           {filteredAppointments.length === 0 ? (
             <div className="p-8 bg-white rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
               No tienes citas asignadas por el momento.
             </div>
           ) : (
             filteredAppointments.map(apt => (
               <div key={apt.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex gap-4 hover:shadow-md transition-shadow">
                 <div className="flex-shrink-0 w-16 text-center pt-1">
                    <span className="block text-xs font-bold text-slate-400 uppercase">
                      {new Date(apt.startDateTime).toLocaleDateString(undefined, {weekday: 'short'})}
                    </span>
                    <span className="block text-xl font-bold text-slate-800">
                      {new Date(apt.startDateTime).getDate()}
                    </span>
                 </div>
                 <div className="flex-grow border-l border-slate-100 pl-4">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-slate-800">{apt.title}</h3>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                            apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 
                            apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-100'
                        }`}>
                            {apt.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-2">
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(apt.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="flex items-center gap-1">
                            <User size={14} />
                            {apt.clientName}
                        </div>
                    </div>
                    {apt.description && <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded">{apt.description}</p>}
                 </div>
               </div>
             ))
           )}
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-1">
            <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg mb-6">
                <h3 className="font-semibold text-indigo-100 text-sm uppercase mb-4">Resumen Hoy</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-3xl font-bold">{filteredAppointments.filter(a => new Date(a.startDateTime).toLocaleDateString() === today).length}</p>
                        <p className="text-indigo-200 text-sm">Citas hoy</p>
                    </div>
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-2">Recordatorios</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                    <li className="flex gap-2 items-start">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0"></span>
                        Revisar inventario de guantes.
                    </li>
                    <li className="flex gap-2 items-start">
                        <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                        Actualizar horarios de la próxima semana.
                    </li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};