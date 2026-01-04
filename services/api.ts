
import { Appointment, User, Role, Professional, Service, LandingSettings, NotificationPreferences, Product, Client, AppointmentStatus, Branch, TemplateId, Transaction } from "../types";

const API_URL = '/api';

export const SOLUTION_TIMEOUT = 1000;
export const ERROR_PROTECTION_CODE = 'AURUM-777';

const DEFAULT_SETTINGS: LandingSettings = {
  businessName: 'Aurum Beauty Studio',
  primaryColor: '#C5A028',
  secondaryColor: '#1A1A1A',
  templateId: 'beauty',
  slogan: 'Redefiniendo la Estética de Ultra-Lujo',
  aboutText: 'Santuario de belleza líder en alta tecnología. Fusionamos arte y ciencia para crear resultados naturales.',
  address: 'Presidente Masaryk 450, Polanco, CDMX',
  contactPhone: '+52 55 7142 7321',
  heroImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=2000'
};

export const api = {
  getLandingSettings: async (): Promise<LandingSettings> => {
    try {
        const res = await fetch(`${API_URL}/settings/landing`);
        if (!res.ok) return DEFAULT_SETTINGS;
        const data = await res.json();
        return { ...DEFAULT_SETTINGS, ...data };
    } catch {
        return DEFAULT_SETTINGS;
    }
  },

  updateLandingSettings: async (s: LandingSettings): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/settings/landing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
      return res.ok;
    } catch { return false; }
  },

  getServices: async (): Promise<Service[]> => {
    try {
        const res = await fetch(`${API_URL}/services`);
        return res.ok ? res.json() : [];
    } catch {
        return [];
    }
  },

  createService: async (s: Omit<Service, 'id'>): Promise<Service> => {
    const res = await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
    return res.json();
  },

  updateService: async (s: Service): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/services/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
      return res.ok;
    } catch { return false; }
  },

  deleteService: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/services/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch { return false; }
  },

  login: async (phone: string, pass: string): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password: pass })
        });
        
        if (!res.ok) {
            console.warn("Login attempt failed with status:", res.status);
            return null;
        }

        const data = await res.json();
        return data.success ? data.user : null;
    } catch (e) { 
        console.error("Critical login network error:", e);
        return null; 
    }
  },

  getClients: async (): Promise<Client[]> => {
    try {
      const res = await fetch(`${API_URL}/clients`);
      return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createClient: async (c: Partial<User>): Promise<any> => {
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c)
    });
    return res.json();
  },

  getAppointments: async (): Promise<Appointment[]> => {
    try {
      const res = await fetch(`${API_URL}/appointments`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((a: any) => ({
        id: a.id?.toString(),
        title: a.title,
        startDateTime: a.start_datetime || a.startDateTime,
        endDateTime: a.end_datetime || a.endDateTime,
        clientName: a.client_name || a.clientName,
        clientPhone: a.client_phone || a.clientPhone,
        status: a.status,
        professionalId: a.professional_id?.toString() || a.professionalId?.toString(),
        serviceId: a.service_id?.toString() || a.serviceId?.toString(),
        description: a.notes || a.description,
        branchId: a.branch_id?.toString() || a.branchId?.toString()
      }));
    } catch { return []; }
  },

  createAppointment: async (a: Omit<Appointment, 'id'>) => {
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(a)
    });
    return res.json();
  },

  cancelAppointment: async (id: string) => {
    const res = await fetch(`${API_URL}/appointments/${id}/cancel`, { method: 'POST' });
    return res.json();
  },

  getProducts: async (): Promise<Product[]> => {
    try {
      const res = await fetch(`${API_URL}/products`);
      return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createProduct: async (p: Product): Promise<any> => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    return res.json();
  },

  updateProduct: async (p: Product): Promise<any> => {
    const res = await fetch(`${API_URL}/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    return res.json();
  },

  getProfessionals: async (): Promise<Professional[]> => {
    try {
      const res = await fetch(`${API_URL}/professionals`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        role: p.role,
        email: p.email,
        serviceIds: p.service_ids || [],
        weeklySchedule: p.weekly_schedule || [],
        exceptions: p.exceptions || [],
        birthDate: p.birth_date || p.birthDate
      }));
    } catch { return []; }
  },

  createProfessional: async (p: Omit<Professional, 'id'>): Promise<{success: boolean, id?: string}> => {
    const res = await fetch(`${API_URL}/professionals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    const data = await res.json();
    return { success: data.success, id: data.id?.toString() };
  },

  updateProfessional: async (p: Professional): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/professionals/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      return res.ok;
    } catch { return false; }
  },

  getProfessionalAppointments: async (proId: string): Promise<Appointment[]> => {
    try {
      const res = await fetch(`${API_URL}/professionals/${proId}/appointments`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((a: any) => ({
        id: a.id.toString(),
        title: a.title,
        startDateTime: a.start_datetime || a.startDateTime,
        endDateTime: a.end_datetime || a.endDateTime,
        clientName: a.client_name || a.clientName,
        clientPhone: a.client_phone || a.clientPhone,
        status: a.status,
        professionalId: a.professional_id?.toString() || a.professionalId?.toString(),
        serviceId: a.service_id?.toString() || a.serviceId?.toString(),
        description: a.notes || a.description,
        branchId: a.branch_id?.toString() || a.branchId?.toString()
      }));
    } catch { return []; }
  },

  completeAppointment: async (id: string, notes: string): Promise<any> => {
    const res = await fetch(`${API_URL}/appointments/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    return res.json();
  },

  updatePreferences: async (userId: string, prefs: NotificationPreferences): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
      return res.ok;
    } catch { return false; }
  },

  processSale: async (saleData: any): Promise<{success: boolean, saleId?: string, date?: string}> => {
    const res = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    return res.json();
  },

  getBusinessStats: async (): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/analytics/stats`);
      return res.ok ? res.json() : { revenueThisMonth: 0, appointmentsCompleted: 0, newClientsThisMonth: 0, occupationRate: 0 };
    } catch { return { revenueThisMonth: 0, appointmentsCompleted: 0, newClientsThisMonth: 0, occupationRate: 0 }; }
  },

  getBranches: async (): Promise<Branch[]> => {
    try {
      const res = await fetch(`${API_URL}/branches`);
      return res.ok ? res.json() : [];
    } catch { return []; }
  }
};
