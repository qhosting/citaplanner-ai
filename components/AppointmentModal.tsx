import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Appointment, AppointmentStatus } from '../types';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apt: Appointment) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60); // minutes

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${date}T${time}`);
    const end = new Date(start.getTime() + duration * 60000);

    const newAppointment: Appointment = {
      // Use Date + Math.random fallback for non-secure contexts
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      title,
      clientName,
      clientPhone,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      status: AppointmentStatus.SCHEDULED,
      description: 'Agendado manualmente',
    };

    onSave(newAppointment);
    onClose();
    // Reset form
    setTitle('');
    setClientName('');
    setClientPhone('');
    setDate('');
    setTime('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-semibold text-lg text-slate-800">Nueva Cita</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Ej: Consulta"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Cliente</label>
                <input
                  required
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Nombre"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="+52..."
                />
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora</label>
              <input
                required
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duración (minutos)</label>
             <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1.5 horas</option>
              <option value={120}>2 horas</option>
            </select>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Guardar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};