
import { Appointment, User, Role, Professional, Service, LandingSettings, NotificationPreferences, Product, Client, AppointmentStatus, Branch, TemplateId, Transaction } from "../types";

const API_URL = '/api';

export const SOLUTION_TIMEOUT = 1000;
export const ERROR_PROTECTION_CODE = 'AURUM-777';

const DEFAULT_LANDING_SETTINGS: LandingSettings = {
  businessName: 'CitaPlanner Elite',
  primaryColor: '#630E14',
  secondaryColor: '#C5A028',
  templateId: 'citaplanner',
  slogan: 'Gestión de Lujo Simplificada',
  aboutText: 'Plataforma líder en gestión de citas y negocios de belleza.',
  address: 'Av. Principal 123, CDMX',
  contactPhone: '+52 55 1234 5678'
};

const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const branchId = localStorage.getItem('aurum_branch_id');
    if (branchId) {
        headers['x-branch-id'] = branchId;
    }
    return headers;
};

// Safe Fetch with Timeout
const safeFetch = async (url: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8 seconds limit
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        console.warn(`Fetch timeout or error for ${url}`);
        throw error;
    }
};

export const api = {
  getBranches: async (): Promise<Branch[]> => {
    try {
        const res = await safeFetch(`${API_URL}/branches`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },
  
  getClients: async (): Promise<User[]> => {
    try {
        const res = await safeFetch(`${API_URL}/clients`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createClient: async (client: Partial<User>): Promise<User | null> => {
    try {
        const res = await safeFetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(client)
        });
        return res.ok ? res.json() : null;
    } catch { return null; }
  },

  getProducts: async (): Promise<any[]> => {
    try {
        const res = await safeFetch(`${API_URL}/products`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createProduct: async (product: Partial<Product>) => {
    try {
        const res = await safeFetch(`${API_URL}/products`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(product)
        });
        return res.ok;
    } catch { return false; }
  },

  updateProduct: async (product: Product) => {
    try {
        const res = await safeFetch(`${API_URL}/products/${product.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(product)
        });
        return res.ok;
    } catch { return false; }
  },

  getLandingSettings: async (): Promise<LandingSettings> => {
    try {
        const res = await safeFetch(`${API_URL}/settings/landing`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            const merged = { ...DEFAULT_LANDING_SETTINGS, ...data };
            if (!merged.businessName) merged.businessName = DEFAULT_LANDING_SETTINGS.businessName;
            if (!merged.primaryColor) merged.primaryColor = DEFAULT_LANDING_SETTINGS.primaryColor;
            return merged;
        }
        return DEFAULT_LANDING_SETTINGS;
    } catch (e) {
        return DEFAULT_LANDING_SETTINGS;
    }
  },

  updateLandingSettings: async (settings: LandingSettings): Promise<boolean> => {
    try {
        const res = await safeFetch(`${API_URL}/settings/landing`, {
        method: 'POST', 
        headers: getHeaders(),
        body: JSON.stringify(settings)
        });
        return res.ok;
    } catch { return false; }
  },

  getBusinessStats: async () => {
    try {
        const res = await safeFetch(`${API_URL}/stats/business`, { headers: getHeaders() });
        return res.ok ? res.json() : { revenueThisMonth: 0, appointmentsCompleted: 0, newClientsThisMonth: 0, occupationRate: 0 };
    } catch { return { revenueThisMonth: 0, appointmentsCompleted: 0, newClientsThisMonth: 0, occupationRate: 0 }; }
  },

  getIntegrationStatus: async () => {
    try {
        const res = await safeFetch(`${API_URL}/integrations/status`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  login: async (phone: string, pass: string): Promise<User | null> => {
    try {
        const res = await safeFetch(`${API_URL}/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ phone, password: pass })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.success ? data.user : null;
    } catch { return null; }
  },

  getServices: async (): Promise<Service[]> => {
    try {
        const res = await safeFetch(`${API_URL}/services`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createService: async (service: Omit<Service, 'id'>): Promise<Service | null> => {
    try {
        const res = await safeFetch(`${API_URL}/services`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(service)
        });
        return res.ok ? res.json() : null;
    } catch { return null; }
  },

  updateService: async (service: Service): Promise<boolean> => {
    try {
        const res = await safeFetch(`${API_URL}/services/${service.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(service)
        });
        return res.ok;
    } catch { return false; }
  },

  deleteService: async (id: string): Promise<boolean> => {
    try {
        const res = await safeFetch(`${API_URL}/services/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
        });
        return res.ok;
    } catch { return false; }
  },

  getProfessionals: async (): Promise<Professional[]> => {
    try {
        const res = await safeFetch(`${API_URL}/professionals`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createProfessional: async (pro: Omit<Professional, 'id'>): Promise<{success: boolean, id?: string}> => {
    try {
        const res = await safeFetch(`${API_URL}/professionals`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(pro)
        });
        if (!res.ok) return { success: false };
        const data = await res.json();
        return { success: true, id: data.id };
    } catch { return { success: false }; }
  },

  updateProfessional: async (pro: Professional): Promise<boolean> => {
    try {
        const res = await safeFetch(`${API_URL}/professionals/${pro.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(pro)
        });
        return res.ok;
    } catch { return false; }
  },

  getAppointments: async (): Promise<Appointment[]> => {
    try {
        const res = await safeFetch(`${API_URL}/appointments`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  getProfessionalAppointments: async (proId: string): Promise<Appointment[]> => {
    try {
        const res = await safeFetch(`${API_URL}/professionals/${proId}/appointments`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createAppointment: async (a: Omit<Appointment, 'id'>) => {
    try {
        const res = await safeFetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(a)
        });
        return res.json();
    } catch { return null; }
  },

  completeAppointment: async (id: string, notes: string): Promise<boolean> => {
    try {
        const res = await safeFetch(`${API_URL}/appointments/${id}/complete`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ notes })
        });
        return res.ok;
    } catch { return false; }
  },

  cancelAppointment: async (id: string): Promise<boolean> => {
    try {
        const res = await safeFetch(`${API_URL}/appointments/${id}/cancel`, {
        method: 'POST',
        headers: getHeaders()
        });
        return res.ok;
    } catch { return false; }
  },

  updatePreferences: async (userId: string, preferences: NotificationPreferences): Promise<boolean> => {
    try {
        const res = await safeFetch(`${API_URL}/users/${userId}/preferences`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ preferences })
        });
        return res.ok;
    } catch { return false; }
  },

  getVapidPublicKey: async (): Promise<string | null> => {
    try {
        const res = await safeFetch(`${API_URL}/notifications/vapid-public-key`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            return data.publicKey;
        }
        return null;
    } catch { return null; }
  },

  subscribeToNotifications: async (subscription: any, userId: string): Promise<boolean> => {
    try {
        const res = await safeFetch(`${API_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ subscription, userId })
        });
        return res.ok;
    } catch { return false; }
  },

  processSale: async (saleData: any): Promise<{success: boolean, saleId?: string, date?: string}> => {
    try {
        const res = await safeFetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(saleData)
        });
        if (!res.ok) return { success: false };
        return res.json();
    } catch { return { success: false }; }
  }
};
