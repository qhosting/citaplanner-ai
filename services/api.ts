
import { Appointment, User, Professional, Service, LandingSettings, NotificationPreferences, Product, Client, Branch, InventoryMovement } from "../types";

const API_URL = '/api';

export const SOLUTION_TIMEOUT = 1000;
export const ERROR_PROTECTION_CODE = '777';

const DEFAULT_LANDING_DATA: LandingSettings = {
  businessName: 'Aurum Beauty Studio',
  primaryColor: '#D4AF37',
  secondaryColor: '#050505',
  templateId: 'beauty',
  slogan: 'Redefiniendo la Estética de Ultra-Lujo',
  aboutText: 'Santuario de belleza líder en alta tecnología.',
  address: 'Dirección no configurada',
  contactPhone: '+52 55 7142 7321',
  heroSlides: [],
  stats: [],
  testimonials: [],
  gallery: [],
  socialLinks: { instagram: '', facebook: '', tiktok: '' },
  maintenanceMode: false,
  showWhatsappButton: true,
  operatingHours: []
};

export const api = {
  uploadImage: async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? data.url : null;
    } catch (error) { return null; }
  },

  getLandingSettings: async (): Promise<LandingSettings> => {
    try {
        const res = await fetch(`${API_URL}/settings/landing`);
        if (res.ok) {
          const data = await res.json();
          return { ...DEFAULT_LANDING_DATA, ...data };
        }
        return DEFAULT_LANDING_DATA;
    } catch { return DEFAULT_LANDING_DATA; }
  },

  updateLandingSettings: async (s: LandingSettings): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/settings/landing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
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
        if (!res.ok) return null;
        const data = await res.json();
        return data.success ? data.user : null;
    } catch (e) { return null; }
  },

  updateProfile: async (userId: string, data: Partial<User>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch { return false; }
  },

  updatePassword: async (userId: string, current: string, next: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, next })
      });
      return res.ok;
    } catch { return false; }
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

  getClients: async (): Promise<Client[]> => {
    try {
      const res = await fetch(`${API_URL}/clients`);
      return res.ok ? await res.json() : [];
    } catch { return []; }
  },

  createClient: async (c: Partial<Client>): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...c, treatmentHistory: [] })
      });
      return res.json();
    } catch { return { success: false }; }
  },

  updateClient: async (c: Client): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/clients/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
      });
      return res.ok;
    } catch { return false; }
  },

  deleteClient: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch { return false; }
  },

  getAppointments: async (): Promise<Appointment[]> => {
    try {
      const res = await fetch(`${API_URL}/appointments`);
      return res.ok ? res.json() : [];
    } catch { return []; }
  },

  getProfessionalAppointments: async (proId: string): Promise<Appointment[]> => {
    try {
      const res = await fetch(`${API_URL}/appointments?professionalId=${proId}`);
      return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createAppointment: async (a: Omit<Appointment, 'id'>) => {
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a)
      });
      return res.json();
    } catch { return { success: false }; }
  },

  completeAppointment: async (id: string, notes: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      return res.ok;
    } catch { return false; }
  },

  cancelAppointment: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}/cancel`, {
        method: 'POST'
      });
      return res.ok;
    } catch { return false; }
  },

  getProducts: async (): Promise<Product[]> => {
    try {
      const res = await fetch(`${API_URL}/products`);
      return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createProduct: async (p: Product): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      return res.json();
    } catch { return { success: false }; }
  },

  updateProduct: async (p: Product): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      return res.json();
    } catch { return { success: false }; }
  },

  getInventoryMovements: async (): Promise<InventoryMovement[]> => {
    try {
      const res = await fetch(`${API_URL}/inventory/movements`);
      return res.ok ? res.json() : [];
    } catch { return []; }
  },

  processSale: async (saleData: any): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      return res.json();
    } catch { return { success: false }; }
  },

  getProfessionals: async (): Promise<Professional[]> => {
    try {
      const res = await fetch(`${API_URL}/professionals`);
      return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createProfessional: async (p: Omit<Professional, 'id'>): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/professionals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      return res.json();
    } catch { return { success: false }; }
  },

  updateProfessional: async (p: Professional): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/professionals/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      return res.json();
    } catch { return { success: false }; }
  },

  getBranches: async (): Promise<Branch[]> => {
    try {
      const res = await fetch(`${API_URL}/branches`);
      return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createBranch: async (b: Omit<Branch, 'id'>): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      return res.json();
    } catch { return { success: false }; }
  },

  updateBranch: async (b: Branch): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/branches/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
      return res.ok;
    } catch { return false; }
  },

  deleteBranch: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/branches/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch { return false; }
  },

  getServices: async (): Promise<Service[]> => {
    try {
        const res = await fetch(`${API_URL}/services`);
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createService: async (s: Omit<Service, 'id'>): Promise<Service | null> => {
    try {
      const res = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s)
      });
      return res.ok ? res.json() : null;
    } catch { return null; }
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
      const res = await fetch(`${API_URL}/services/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch { return false; }
  },

  getBusinessStats: async (): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/analytics/stats`);
      return res.ok ? res.json() : { revenueThisMonth: 0, appointmentsCompleted: 0, newClientsThisMonth: 0, occupationRate: 0 };
    } catch { return { revenueThisMonth: 0, appointmentsCompleted: 0, newClientsThisMonth: 0, occupationRate: 0 }; }
  }
};
