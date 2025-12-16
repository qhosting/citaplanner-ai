import { Appointment, User, AppointmentStatus, Role, Sale, NotificationPreferences, Professional, Service } from "../types";

// En producción, esto apuntaría a tu dominio real o contenedor
// Si estás en desarrollo local, usa http://localhost:3000
const API_URL = 'http://localhost:3000/api';

// --- MOCK DATA FOR OFFLINE/DEMO MODE ---
// Se usa cuando el backend no está disponible (NetworkError)
const MOCK_USERS = [
  { id: '1', name: 'Admin Principal', phone: 'admin', password: '123', role: 'ADMIN' as Role, avatar: 'AD' },
  { id: '2', name: 'Dra. Ana López', phone: '5551001', password: '123', role: 'PROFESSIONAL' as Role, relatedId: '1', avatar: 'AL' },
  { id: '3', name: 'Maria Garcia', phone: '5512345678', password: '123', role: 'CLIENT' as Role, avatar: 'MG' }
];

let MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    title: 'Consulta General (Demo)',
    startDateTime: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
    endDateTime: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
    clientName: 'Maria Garcia',
    clientPhone: '5512345678',
    status: AppointmentStatus.SCHEDULED,
    description: 'Cita generada automáticamente en modo demostración.',
    professionalId: '1'
  }
];

const MOCK_SERVICES: Service[] = [
  { id: 's1', name: 'Consulta General', duration: 30, price: 50, description: 'Evaluación inicial y diagnóstico.', category: 'General', status: 'ACTIVE' },
  { id: 's2', name: 'Limpieza Dental Profunda', duration: 60, price: 80, description: 'Higiene completa con ultrasonido.', category: 'Odontología', status: 'ACTIVE' },
  { id: 's3', name: 'Blanqueamiento', duration: 90, price: 150, description: 'Tratamiento estético avanzado.', category: 'Estética', status: 'ACTIVE' },
  { id: 's4', name: 'Ortodoncia Revisión', duration: 20, price: 40, description: 'Ajuste de brackets mensual.', category: 'Ortodoncia', status: 'ACTIVE' },
];

// Datos por defecto para profesionales si el backend falla
const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: '1',
    name: 'Dra. Ana López',
    role: 'Odontóloga General',
    email: 'ana@example.com',
    serviceIds: ['1', '2', '3'],
    weeklySchedule: [
        { dayOfWeek: 1, isEnabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 2, isEnabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 3, isEnabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 4, isEnabled: true, slots: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 5, isEnabled: true, slots: [{ start: '09:00', end: '14:00' }] },
        { dayOfWeek: 6, isEnabled: false, slots: [] },
        { dayOfWeek: 0, isEnabled: false, slots: [] },
    ],
    exceptions: []
  },
  {
    id: '2',
    name: 'Dr. Carlos Ruiz',
    role: 'Ortodoncista',
    email: 'carlos@example.com',
    serviceIds: ['1', '4'],
    weeklySchedule: [
        { dayOfWeek: 1, isEnabled: true, slots: [{ start: '10:00', end: '18:00' }] },
        { dayOfWeek: 3, isEnabled: true, slots: [{ start: '10:00', end: '18:00' }] },
        { dayOfWeek: 5, isEnabled: true, slots: [{ start: '10:00', end: '18:00' }] },
        { dayOfWeek: 2, isEnabled: false, slots: [] },
        { dayOfWeek: 4, isEnabled: false, slots: [] },
        { dayOfWeek: 6, isEnabled: false, slots: [] },
        { dayOfWeek: 0, isEnabled: false, slots: [] },
    ],
    exceptions: []
  }
];

export const api = {
  // Autenticación
  login: async (phone: string, password: string): Promise<User | null> => {
    try {
      // Intentar fetch con timeout corto para no bloquear UX si no hay backend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error('Auth failed');
      const data = await res.json();
      return data.user;
    } catch (error) {
      console.warn("API Backend no disponible. Usando modo Demo Local para Login.");
      
      // Fallback Local
      const user = MOCK_USERS.find(u => u.phone === phone && u.password === password);
      if (user) {
        // Retornar objeto usuario sin password y con preferencias por defecto
        const { password: _, ...safeUser } = user;
        return {
           ...safeUser,
           preferences: { whatsapp: true, sms: true, email: true }
        };
      }
      return null;
    }
  },
  
  // Actualizar Preferencias de Notificación
  updatePreferences: async (userId: string, preferences: NotificationPreferences): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/profile/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, preferences }),
      });
      return res.ok;
    } catch (error) {
      console.warn("API Backend no disponible. Guardando preferencias localmente (Mock).");
      return true;
    }
  },

  // Obtener Citas
  getAppointments: async (): Promise<Appointment[]> => {
    try {
      const res = await fetch(`${API_URL}/appointments`);
      if (!res.ok) throw new Error('Error fetching appointments');
      return await res.json();
    } catch (error) {
      console.warn("API Backend no disponible. Mostrando citas locales.");
      return [...MOCK_APPOINTMENTS];
    }
  },

  // Crear Cita
  createAppointment: async (appointment: Omit<Appointment, 'id'>): Promise<Appointment | null> => {
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment)
      });
      if (!res.ok) throw new Error('Error creating appointment');
      return await res.json();
    } catch (error) {
      console.warn("API Backend no disponible. Guardando cita en memoria local.");
      const newApt: Appointment = {
        ...appointment,
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
      };
      MOCK_APPOINTMENTS.push(newApt);
      return newApt;
    }
  },

  // Actualizar Estado
  updateAppointmentStatus: async (id: string, status: AppointmentStatus): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return res.ok;
    } catch (error) {
      console.warn("API Backend no disponible. Actualizando estado localmente.");
      MOCK_APPOINTMENTS = MOCK_APPOINTMENTS.map(a => a.id === id ? { ...a, status } : a);
      return true;
    }
  },

  // POS: Procesar Venta
  processSale: async (saleData: Omit<Sale, 'id' | 'date'>): Promise<{success: boolean, saleId?: string, date?: string}> => {
    try {
      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      if (!res.ok) throw new Error('Error processing sale');
      return await res.json();
    } catch (error) {
      console.error("API Backend no disponible o error en venta:", error);
      // Fallback simulación
      return { success: true, saleId: `OFFLINE-${Date.now()}`, date: new Date().toISOString() };
    }
  },

  // Birthday Automation
  getBirthdaysToday: async () => {
    try {
      const res = await fetch(`${API_URL}/birthdays/today`);
      if (!res.ok) throw new Error("Failed to fetch birthdays");
      return await res.json();
    } catch (error) {
      // Mock data for offline
      return [
        { id: '1', name: 'Maria Garcia', role: 'Cliente' },
        { id: 'u2', name: 'Dra. Ana López', role: 'Profesional' }
      ];
    }
  },

  runBirthdayCheck: async () => {
    try {
      const res = await fetch(`${API_URL}/integrations/birthdays/check`, { method: 'POST' });
      return await res.json();
    } catch (error) {
      return { success: false, message: "Error conectando al servicio de automátización" };
    }
  },

  // --- SERVICES CATALOG ---

  getServices: async (includeInactive: boolean = false): Promise<Service[]> => {
    try {
      const query = includeInactive ? '?all=true' : '';
      const res = await fetch(`${API_URL}/services${query}`);
      if (!res.ok) throw new Error('Failed to fetch services');
      return await res.json();
    } catch (error) {
      console.warn("API Backend no disponible. Usando servicios mock.");
      return MOCK_SERVICES;
    }
  },

  createService: async (service: Omit<Service, 'id'>): Promise<Service | null> => {
    try {
      const res = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
      });
      if (!res.ok) throw new Error('Error creating service');
      return await res.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  updateService: async (service: Service): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
      });
      return res.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  deleteService: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  
  // --- PROFESSIONALS & SCHEDULES ---

  getProfessionals: async (): Promise<Professional[]> => {
    try {
      const res = await fetch(`${API_URL}/professionals`);
      if (!res.ok) throw new Error('Failed to fetch professionals');
      return await res.json();
    } catch (error) {
      console.warn("API Backend no disponible. Usando profesionales mock.");
      return MOCK_PROFESSIONALS;
    }
  },

  updateProfessional: async (pro: Professional): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/professionals/${pro.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pro)
      });
      return res.ok;
    } catch (error) {
      console.error("Error updating professional:", error);
      return false;
    }
  },
  
  createProfessional: async (pro: Omit<Professional, 'id'>): Promise<{success: boolean, id?: string}> => {
    try {
      const res = await fetch(`${API_URL}/professionals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pro)
      });
      return await res.json();
    } catch (error) {
      console.error("Error creating professional:", error);
      return { success: false };
    }
  },

  // --- SYSTEM SETTINGS ---
  getSettings: async (): Promise<{key: string, value: string, category: string, description: string}[]> => {
    try {
      const res = await fetch(`${API_URL}/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      return await res.json();
    } catch (error) {
      console.warn("Settings API not available, using defaults");
      return [
        { key: 'business_name', value: 'Clínica Demo', category: 'GENERAL', description: '' },
        { key: 'n8n_webhook_general', value: '', category: 'INTEGRATION', description: '' }
      ];
    }
  },

  updateSettings: async (settings: {key: string, value: string}[]): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/settings/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
      return res.ok;
    } catch (error) {
      console.error("Error updating settings:", error);
      return false;
    }
  }
};