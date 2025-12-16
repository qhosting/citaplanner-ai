import { Appointment, NotificationPreferences, Campaign, AutomationRule } from "../types";

// URL base de nuestro propio backend
const API_URL = 'http://localhost:3000/api';

/**
 * Trigger genérico para flujos de N8N (WhatsApp, SMS, Email Marketing)
 */
export const triggerN8NWorkflow = async (action: string, appointment: Appointment) => {
  console.log(`[Frontend Integration] Solicitando acción N8N: ${action}`);
  
  try {
    const response = await fetch(`${API_URL}/integrations/n8n`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action, 
        payload: appointment 
      })
    });

    if (!response.ok) throw new Error('Error al conectar con el servidor de integración');
    return await response.json();
  } catch (error) {
    console.error("N8N Trigger Error", error);
    throw error;
  }
};

/**
 * Integración WAHA (WhatsApp) vía Backend -> N8N
 */
export const sendWhatsAppConfirmation = async (appointment: Appointment, preferences?: NotificationPreferences) => {
  if (preferences && !preferences.whatsapp) {
    console.log('[Integration] Notificación WhatsApp omitida por preferencias del usuario.');
    return { skipped: true, message: 'Usuario tiene desactivado WhatsApp' };
  }
  
  if (!appointment.clientPhone) throw new Error("No phone number available");
  return triggerN8NWorkflow('SEND_WHATSAPP', appointment);
};

/**
 * Integración LabsMobile (SMS) vía Backend -> N8N
 */
export const sendSMSReminder = async (appointment: Appointment, preferences?: NotificationPreferences) => {
  if (preferences && !preferences.sms) {
    console.log('[Integration] Notificación SMS omitida por preferencias del usuario.');
    return { skipped: true, message: 'Usuario tiene desactivado SMS' };
  }

  if (!appointment.clientPhone) throw new Error("No phone number available");
  return triggerN8NWorkflow('SEND_SMS', appointment);
};

/**
 * MARKETING: Lanzar Campaña Masiva
 */
export const launchCampaign = async (campaign: Campaign) => {
  console.log(`[Frontend Integration] Lanzando campaña: ${campaign.name}`);
  try {
    const response = await fetch(`${API_URL}/marketing/campaigns/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign })
    });
    return await response.json();
  } catch (error) {
    console.error("Marketing Campaign Error", error);
    throw error;
  }
};

/**
 * MARKETING: Guardar configuración de automatización
 */
export const saveAutomationRule = async (rule: AutomationRule) => {
  try {
    const response = await fetch(`${API_URL}/marketing/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule })
    });
    return await response.json();
  } catch (error) {
    console.error("Automation Rule Error", error);
    throw error;
  }
};

/**
 * Sincronización Odoo (Inventario/Contactos)
 * Se usa cuando se crea un cliente o se actualiza una cita que afecta facturación.
 */
export const syncOdoo = async (entity: 'CONTACT' | 'ORDER', operation: 'CREATE' | 'UPDATE', data: any) => {
  console.log(`[Frontend Integration] Sincronizando Odoo...`);
  try {
    const response = await fetch(`${API_URL}/integrations/odoo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity, operation, data })
    });
    return await response.json();
  } catch (error) {
    console.error("Odoo Sync Error", error);
    throw error;
  }
};

/**
 * Sincronización Chatwoot (CRM)
 * Llama al endpoint dedicado en el backend que maneja la lógica compleja de Chatwoot.
 */
export const syncToChatwoot = async (appointment: Appointment) => {
  console.log(`[Chatwoot] Iniciando sincronización segura desde servidor...`);

  if (!appointment.clientPhone) {
    console.warn("[Chatwoot] Falta teléfono, abortando sync automática.");
    return { success: false, message: 'Falta teléfono' };
  }

  try {
    const response = await fetch(`${API_URL}/integrations/chatwoot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Error en servidor');
    }

    const data = await response.json();
    console.log(`[Chatwoot] Sincronización exitosa. ID Conversación: ${data.conversationId}`);
    return data;

  } catch (error) {
    console.error("[Chatwoot] Falló la integración.", error);
    // Opcional: Fallback a N8N si falla la API directa
    return triggerN8NWorkflow('SYNC_CRM_FALLBACK', appointment);
  }
};