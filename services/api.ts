
import { Appointment, User, Professional, Service, LandingSettings, NotificationPreferences, Product, Client, Branch, InventoryMovement } from "../types";

const API_URL = '/api';

export const SOLUTION_TIMEOUT = 1000;
export const ERROR_PROTECTION_CODE = 'AUM-99';

export const api = {
  // Provisionamiento SaaS (Llamado desde citaplanner.com para vender el servicio)
  registerNewStudio: async (data: { name: string, subdomain: string, adminPhone: string, adminPassword: string }) => {
    try {
      const res = await fetch(`${API_URL}/saas/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch { return { success: false, error: "Falla de red en provisionamiento" }; }
  },

  uploadImage: async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      return data.success ? data.url : null;
    } catch { return null; }
  },

  getLandingSettings: async (): Promise<LandingSettings> => {
    try {
        const res = await fetch(`${API_URL}/settings/landing`);
        return await res.json();
    } catch { return {} as LandingSettings; }
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
        const data = await res.json();
        return data.success ? data.user : null;
    } catch { return null; }
  },

  getClients: async (): Promise<Client[]> => {
    const res = await fetch(`${API_URL}/clients`);
    return res.ok ? await res.json() : [];
  },

  updateClient: async (c: Client): Promise<boolean> => {
    const res = await fetch(`${API_URL}/clients/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c)
    });
    return res.ok;
  },

  createClient: async (c: Partial<Client>): Promise<boolean> => {
    const res = await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c)
    });
    return res.ok;
  },

  deleteClient: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/clients/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  getServices: async (): Promise<Service[]> => {
    const res = await fetch(`${API_URL}/services`);
    return res.ok ? await res.json() : [];
  },

  getAppointments: async (): Promise<Appointment[]> => {
    const res = await fetch(`${API_URL}/appointments`);
    return res.ok ? await res.json() : [];
  },

  createAppointment: async (a: Omit<Appointment, 'id' | 'tenantId'>) => {
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(a)
    });
    return await res.json();
  },

  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_URL}/products`);
    return res.ok ? await res.json() : [];
  },

  getInventoryMovements: async (): Promise<InventoryMovement[]> => {
    const res = await fetch(`${API_URL}/inventory/movements`);
    return res.ok ? await res.json() : [];
  },

  createProduct: async (p: Product): Promise<boolean> => {
    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    return res.ok;
  },

  updateProduct: async (p: Product): Promise<boolean> => {
    const res = await fetch(`${API_URL}/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    return res.ok;
  },

  getProfessionals: async (): Promise<Professional[]> => {
    const res = await fetch(`${API_URL}/professionals`);
    return res.ok ? await res.json() : [];
  },

  createProfessional: async (p: Omit<Professional, 'id' | 'tenantId'>): Promise<{ success: boolean; id?: string }> => {
    const res = await fetch(`${API_URL}/professionals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    return await res.json();
  },

  updateProfessional: async (p: Professional): Promise<boolean> => {
    const res = await fetch(`${API_URL}/professionals/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p)
    });
    return res.ok;
  },

  updatePassword: async (id: string, current: string, next: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/users/${id}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current, next })
    });
    return res.ok;
  },

  updateProfile: async (id: string, data: any): Promise<boolean> => {
    const res = await fetch(`${API_URL}/users/${id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  updatePreferences: async (id: string, prefs: NotificationPreferences): Promise<boolean> => {
    const res = await fetch(`${API_URL}/users/${id}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
    return res.ok;
  },

  getProfessionalAppointments: async (proId: string): Promise<Appointment[]> => {
    const res = await fetch(`${API_URL}/professionals/${proId}/appointments`);
    return res.ok ? await res.json() : [];
  },

  completeAppointment: async (id: string, notes: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/appointments/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    return res.ok;
  },

  cancelAppointment: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/appointments/${id}/cancel`, { method: 'POST' });
    return res.ok;
  },

  updateService: async (s: Service): Promise<boolean> => {
    const res = await fetch(`${API_URL}/services/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
    return res.ok;
  },

  createService: async (s: Omit<Service, 'id' | 'tenantId'>): Promise<Service | null> => {
    const res = await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    });
    return res.ok ? await res.json() : null;
  },

  deleteService: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/services/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  processSale: async (data: any): Promise<{ success: boolean; saleId?: string; date?: string }> => {
    const res = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  getBranches: async (): Promise<Branch[]> => {
    const res = await fetch(`${API_URL}/branches`);
    return res.ok ? await res.json() : [];
  },

  updateBranch: async (b: Branch): Promise<boolean> => {
    const res = await fetch(`${API_URL}/branches/${b.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b)
    });
    return res.ok;
  },

  createBranch: async (b: Omit<Branch, 'id' | 'tenantId'>): Promise<boolean> => {
    const res = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b)
    });
    return res.ok;
  },

  deleteBranch: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/branches/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  getBusinessStats: async (): Promise<any> => {
    const res = await fetch(`${API_URL}/analytics/stats`);
    return res.ok ? await res.json() : { revenueThisMonth: 0, occupationRate: 0 };
  }
};
