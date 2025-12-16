import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, History, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Appointment, AppointmentStatus } from '../types';

export const ClientPortal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // MOCK DATA (In real app, fetch using user.phone)
  const [appointments] = useState<Appointment[]>([
    {
      id: '1',
      title: 'Consulta General',
      startDateTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
      endDateTime: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
      clientName: 'Maria Garcia',
      clientPhone: '5512345678', // Matches Mock User Phone
      status: AppointmentStatus.SCHEDULED,
      description: 'Revisión anual'
    },
    {
      id: 'old1',
      title: 'Limpieza',
      startDateTime: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
      endDateTime: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
      clientName: 'Maria Garcia',
      clientPhone: '5512345678',
      status: AppointmentStatus.COMPLETED,
      description: ''
    }
  ]);

  const myAppointments = appointments.filter(a => a.clientPhone === user?.phone);
  const upcoming = myAppointments.filter(a => new Date(a.startDateTime) > new Date());
  const history = myAppointments.filter(a => new Date(a.startDateTime) <= new Date());

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mi Portal</h1>
          <p className="text-slate-500">Hola, {user?.name}. Gestiona tus visitas.</p>
        </div>
        <button 
          onClick={() => navigate('/book')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          <Plus size={18} /> Nueva Cita
        </button>
      </div>

      <div className="space-y-8">
        {/* Upcoming */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={20} />
            Próximas Citas
          </h2>
          
          {upcoming.length === 0 ? (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-slate-500">
              No tienes citas programadas.
            </div>
          ) : (
            <div className="grid gap-4">
              {upcoming.map(apt => (
                <div key={apt.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800">{apt.title}</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">PROGRAMADA</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 text-slate-600 text-sm mt-3">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      {new Date(apt.startDateTime).toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'})}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-slate-400" />
                      {new Date(apt.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-slate-400" />
                      Consultorio 1
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <History className="text-slate-400" size={20} />
            Historial
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 font-semibold text-slate-600">Fecha</th>
                        <th className="px-6 py-3 font-semibold text-slate-600">Servicio</th>
                        <th className="px-6 py-3 font-semibold text-slate-600 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {history.map(apt => (
                        <tr key={apt.id}>
                            <td className="px-6 py-4 text-slate-600">
                                {new Date(apt.startDateTime).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-800">
                                {apt.title}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                                    {apt.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {history.length === 0 && (
                        <tr><td colSpan={3} className="p-6 text-center text-slate-400">Sin historial reciente.</td></tr>
                    )}
                </tbody>
             </table>
          </div>
        </section>
      </div>
    </div>
  );
};