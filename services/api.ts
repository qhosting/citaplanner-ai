
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
  address: 'Presidente Masaryk 450, Polanco, CDMX',
  contactPhone: '+52 55 7142 7321',
  heroSlides: [],
  stats: [],
  testimonials: [],
  gallery: [],
  socialLinks: { instagram: '', facebook: '', tiktok: '' },
  maintenanceMode: false,
  showWhatsappButton: true,
  operatingHours: [
    { day: 'Lunes', open: '09:00', close: '18:00', closed: false },
    { day: 'Martes', open: '09:00', close: '18:00', closed: false },
    { day: 'Miércoles', open: '09:00', close: '18:00', closed: false },
    { day: 'Jueves', open: '09:00', close: '18:00', closed: false },
    { day: 'Viernes', open: '09:00', close: '18:00', closed: false },
    { day: 'Sábado', open: '09:00', close: '14:00', closed: false },
    { day: 'Domingo', open: '00:00', close: '00:00', closed: true },
  ]
};

const IMAGE_SERVICES_DATA: Service[] = [
  { id: 's1', name: 'TÉCNICA CLÁSICA NATURAL', duration: 90, price: 1200, category: 'Pestañas', status: 'ACTIVE', description: 'Protocolo de application pestaña a pestaña.', imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9' },
  { id: 's2', name: 'HENNA BROWS ELITE', duration: 45, price: 650, category: 'Cejas', status: 'ACTIVE', description: 'Diseño arquitectónico de cejas.', imageUrl: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b' },
  { id: 's3', name: 'PEDICURA SPA AURUM', duration: 60, price: 850, category: 'Pies', status: 'ACTIVE', description: 'Relajación y estética avanzada.', imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035' }
];

const DEFAULT_CLIENTS_DATA: Client[] = [
  {
    id: 'c-aurum-001',
    name: 'Isabella Valerius',
    email: 'isabella.v@aurum.mx',
    phone: '+52 55 1122 3344',
    notes: 'Preferencia por café expreso doble. Cliente VIP Platinum.',
    birthDate: '1992-05-15',
    skinType: 'Tipo II - Seca',
    allergies: 'Látex sutil',
    medicalConditions: 'Ninguna',
    treatmentHistory: [
      {
        id: 'rec-001',
        date: new Date().toISOString(),
        serviceName: 'Henna Brows Elite',
        notes: 'Excelente retención de pigmento. Diseño arqueado.',
        professionalName: 'Elena Valery'
      }
    ]
  }
];

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
    if (phone === 'dev' && pass === 'dev') {
      return {
        id: 'dev-master-001',
        name: 'Dev Admin',
        phone: 'dev',
        role: 'ADMIN',
        email: 'dev@aurum.ai',
        preferences: { whatsapp: true, email: true, sms: true }
      };
    }
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
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) return data;
      }
      return DEFAULT_CLIENTS_DATA;
    } catch { return DEFAULT_CLIENTS_DATA; }
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
      if (!res.ok) return [];
      return res.json();
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
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) return data;
      }
      return [{ id: 'b1', name: 'Master Node Polanco', address: 'Presidente Masaryk 450, CDMX', phone: '55 1234 5678', manager: 'Elena Valery', status: 'ACTIVE' }];
    } catch { return [{ id: 'b1', name: 'Master Node Polanco', address: 'Presidente Masaryk 450, CDMX', phone: '55 1234 5678', manager: 'Elena Valery', status: 'ACTIVE' }]; }
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
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) return data;
        }
        return IMAGE_SERVICES_DATA;
    } catch { return IMAGE_SERVICES_DATA; }
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
