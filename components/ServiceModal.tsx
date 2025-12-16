import React, { useState, useEffect } from 'react';
import { X, BriefcaseMedical, Clock, DollarSign, Tag, FileText } from 'lucide-react';
import { Service } from '../types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
  initialData?: Service;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}) => {
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    duration: 30,
    price: 0,
    description: '',
    category: 'General',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        duration: 30,
        price: 0,
        description: '',
        category: 'General',
        status: 'ACTIVE'
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceToSave: Service = {
      // Si existe initialData.id se usa, sino se genera uno temporal que el padre (o API) manejará
      id: initialData?.id || (Date.now().toString(36) + Math.random().toString(36).substring(2)),
      name: formData.name || 'Nuevo Servicio',
      duration: Number(formData.duration) || 30,
      price: Number(formData.price) || 0,
      description: formData.description || '',
      category: formData.category || 'General',
      status: formData.status as 'ACTIVE' | 'INACTIVE' || 'ACTIVE'
    };

    onSave(serviceToSave);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
              <BriefcaseMedical size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">
                {initialData ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h3>
              <p className="text-xs text-slate-500">Configura los detalles del servicio</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Servicio</label>
            <input
              required
              type="text"
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Consulta General"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  list="categories"
                  type="text"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Categoría"
                />
                <datalist id="categories">
                  <option value="General" />
                  <option value="Odontología" />
                  <option value="Medicina" />
                  <option value="Estética" />
                  <option value="Consultoría" />
                </datalist>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duración (min)</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="number"
                  min="5"
                  step="5"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio ($)</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <div className="relative">
                <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                <textarea
                rows={3}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Detalles sobre qué incluye este servicio..."
                />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-colors"
            >
              {initialData ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};