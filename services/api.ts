
import { Appointment, User, Role, Professional, Service, LandingSettings, NotificationPreferences, Product, Client, AppointmentStatus, Branch, TemplateId, Transaction } from "../types";

const API_URL = '/api';

// Export constants required by components
export const SOLUTION_TIMEOUT = 1000;
export const ERROR_PROTECTION_CODE = 'AURUM-777';

// 8888 - Protection: Fallback Data to prevent White Screen of Death
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

// 319817318 - Macro Salvation: Context Headers Helper
const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const branchId = localStorage.getItem('aurum_branch_id');
    if (branchId) {
        headers['x-branch-id'] = branchId;
    }
    return headers;
};

export const api = {
  // --- BRANCH MANAGEMENT ---
  getBranches: async (): Promise<Branch[]> => {
    try {
        const res = await fetch(`${API_URL}/branches`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },
  
  // --- CLIENTS ---
  getClients: async (): Promise<User[]> => {
    try {
        const res = await fetch(`${API_URL}/clients`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createClient: async (client: Partial<User>): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(client)
        });
        return res.ok ? res.json() : null;
    } catch { return null; }
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<any[]> => {
    try {
        const res = await fetch(`${API_URL}/products`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createProduct: async (product: Partial<Product>) => {
    const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(product)
    });
    return res.ok;
  },

  updateProduct: async (product: Product) => {
    const res = await fetch(`${API_URL}/products/${product.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(product)
    });
    return res.ok;
  },

  // --- CORE & SETTINGS ---
  getLandingSettings: async (): Promise<LandingSettings> => {
    try {
        const res = await fetch(`${API_URL}/settings/landing`, { headers: getHeaders() });
        if (res.ok) {
            const data = await res.json();
            // Ensure we return valid object merged with defaults to prevent missing keys
            // IMPORTANT: If 'data' contains null values, they override the defaults in spread syntax.
            // We must manually ensure critical fields are present.
            const merged = { ...DEFAULT_LANDING_SETTINGS, ...data };
            if (!merged.businessName) merged.businessName = DEFAULT_LANDING_SETTINGS.businessName;
            if (!merged.primaryColor) merged.primaryColor = DEFAULT_LANDING_SETTINGS.primaryColor;
            return merged;
        }
        return DEFAULT_LANDING_SETTINGS;
    } catch (e) {
        console.warn("API Settings unreachable, using Fallback:", e);
        return DEFAULT_LANDING_SETTINGS;
    }
  },

  updateLandingSettings: async (settings: LandingSettings): Promise<boolean> => {
    try {
        const res = await fetch(`${API_URL}/settings/landing`, {
        method: 'POST', 
        headers: getHeaders(),
        body: JSON.stringify(settings)
        });
        return res.ok;
    } catch { return false; }
  },

  getBusinessStats: async () => {
    try {
        const res = await fetch(`${API_URL}/stats/business`, { headers: getHeaders() });
        return res.ok ? res.json() : { revenueThisMonth: 0, appointmentsCompleted: 0, newClientsThisMonth: 0, occupationRate: 0 };
    } catch { return { revenueThisMonth: 0, appointmentsCompleted: 0, newClientsThisMonth: 0, occupationRate: 0 }; }
  },

  login: async (phone: string, pass: string): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ phone, password: pass })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.success ? data.user : null;
    } catch { return null; }
  },

  // --- SERVICES ---
  getServices: async (): Promise<Service[]> => {
    try {
        const res = await fetch(`${API_URL}/services`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createService: async (service: Omit<Service, 'id'>): Promise<Service | null> => {
    const res = await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(service)
    });
    return res.ok ? res.json() : null;
  },

  updateService: async (service: Service): Promise<boolean> => {
    const res = await fetch(`${API_URL}/services/${service.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(service)
    });
    return res.ok;
  },

  deleteService: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  },

  // --- PROFESSIONALS ---
  getProfessionals: async (): Promise<Professional[]> => {
    try {
        const res = await fetch(`${API_URL}/professionals`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createProfessional: async (pro: Omit<Professional, 'id'>): Promise<{success: boolean, id?: string}> => {
    const res = await fetch(`${API_URL}/professionals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(pro)
    });
    if (!res.ok) return { success: false };
    const data = await res.json();
    return { success: true, id: data.id };
  },

  updateProfessional: async (pro: Professional): Promise<boolean> => {
    const res = await fetch(`${API_URL}/professionals/${pro.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(pro)
    });
    return res.ok;
  },

  // --- APPOINTMENTS ---
  getAppointments: async (): Promise<Appointment[]> => {
    try {
        const res = await fetch(`${API_URL}/appointments`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  getProfessionalAppointments: async (proId: string): Promise<Appointment[]> => {
    try {
        const res = await fetch(`${API_URL}/professionals/${proId}/appointments`, { headers: getHeaders() });
        return res.ok ? res.json() : [];
    } catch { return []; }
  },

  createAppointment: async (a: Omit<Appointment, 'id'>) => {
    try {
        const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(a)
        });
        return res.json();
    } catch { return null; }
  },

  completeAppointment: async (id: string, notes: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/appointments/${id}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ notes })
    });
    return res.ok;
  },

  cancelAppointment: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/appointments/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.ok;
  },

  updatePreferences: async (userId: string, preferences: NotificationPreferences): Promise<boolean> => {
    const res = await fetch(`${API_URL}/users/${userId}/preferences`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ preferences })
    });
    return res.ok;
  },

  processSale: async (saleData: any): Promise<{success: boolean, saleId?: string, date?: string}> => {
    try {
        const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(saleData)
        });
        if (!res.ok) return { success: false };
        return res.json();
    } catch { return { success: false }; }
  }
};
