import React, { useState } from 'react';
import { User, Phone, Mail, Plus, Search, Trash2, Edit2, StickyNote, Calendar, Gift } from 'lucide-react';
import { Client } from '../types';

export const ClientsPage: React.FC = () => {
  // Mock initial data
  const [clients, setClients] = useState<Client[]>([
    { id: '1', name: 'Maria Garcia', email: 'maria@example.com', phone: '+1 555-0101', notes: 'Cliente VIP. Prefiere citas por la mañana.', birthDate: '1990-05-15' },
    { id: '2', name: 'Juan Perez', email: 'juan@example.com', phone: '+1 555-0102', notes: '', birthDate: new Date().toISOString().split('T')[0] }, // Cumpleaños hoy para demo
    { id: '3', name: 'Roberto Sanchez', email: 'roberto@company.com', phone: '+1 555-0103', notes: 'Contacto clave de la empresa Acme Corp.' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Consolidated form state including notes and birthDate
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', notes: '', birthDate: '' });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isBirthdayToday = (dateString?: string) => {
    if (!dateString) return false;
    const today = new Date();
    const birth = new Date(dateString);
    // Usar UTC methods para evitar problemas de zona horaria con strings simples YYYY-MM-DD
    return today.getUTCDate() === birth.getUTCDate() && today.getUTCMonth() === birth.getUTCMonth();
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing client
      setClients(clients.map(c => c.id === editingId ? { ...c, ...formData } : c));
      setEditingId(null);
    } else {
      // Create new client with safe ID
      const client: Client = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        ...formData
      };
      setClients([...clients, client]);
    }
    
    // Reset form
    setFormData({ name: '', email: '', phone: '', notes: '', birthDate: '' });
    setIsFormOpen(false);
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      notes: client.notes || '',
      birthDate: client.birthDate || ''
    });
    setEditingId(client.id);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setFormData({ name: '', email: '', phone: '', notes: '', birthDate: '' });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    if(window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          <p className="text-slate-500">Gestiona tu base de datos de contactos</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', email: '', phone: '', notes: '', birthDate: '' });
            setEditingId(null);
            setIsFormOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          {editingId ? 'Editar Cliente' : 'Añadir Cliente'}
        </button>
      </div>

      {/* Add/Edit Client Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-fade-in-down">
          <h3 className="font-semibold mb-4 text-slate-700">
            {editingId ? 'Editar Cliente' : 'Detalles del Nuevo Cliente'}
          </h3>
          <form onSubmit={handleSaveClient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
              <input
                required
                placeholder="Ej: Maria Garcia"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                placeholder="ejemplo@correo.com"
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input
                placeholder="+1 234 567 890"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={e => setFormData({...formData, birthDate: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">Para enviar felicitaciones automáticas.</p>
            </div>
            
            {/* Notes Field - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
              <textarea
                placeholder="Información adicional, preferencias del cliente, historial..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[80px]"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button 
                type="button" 
                onClick={handleCancel}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-md"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
              >
                {editingId ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar clientes por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full relative overflow-hidden">
            {isBirthdayToday(client.birthDate) && (
              <div className="absolute top-0 right-0 bg-pink-100 text-pink-600 px-3 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1 z-10">
                <Gift size={12} /> ¡Cumpleaños!
              </div>
            )}
            
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{client.name}</h3>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Cliente</span>
                </div>
              </div>
              <div className="flex gap-1">
                 <button 
                  onClick={() => handleEdit(client)}
                  className="text-slate-300 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(client.id)}
                  className="text-slate-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-600 flex-grow">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                {client.email || 'Sin email'}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" />
                {client.phone || 'Sin teléfono'}
              </div>
              {client.birthDate && (
                <div className="flex items-center gap-2">
                   <Calendar size={16} className={isBirthdayToday(client.birthDate) ? "text-pink-500" : "text-slate-400"} />
                   <span className={isBirthdayToday(client.birthDate) ? "font-bold text-pink-600" : ""}>
                     {new Date(client.birthDate).toLocaleDateString()}
                   </span>
                </div>
              )}
            </div>

            {/* Notes Display */}
            {client.notes && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex gap-2 items-start text-xs text-slate-500 bg-slate-50 p-2.5 rounded-md">
                   <StickyNote size={14} className="mt-0.5 flex-shrink-0 text-slate-400" />
                   <p className="line-clamp-3 italic leading-relaxed">{client.notes}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No se encontraron clientes con esos criterios.
          </div>
        )}
      </div>
    </div>
  );
};