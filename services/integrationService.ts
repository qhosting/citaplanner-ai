
import { Appointment, NotificationPreferences, Campaign, AutomationRule } from "../types";

// URL base dinámica que detecta si estamos en el contenedor o local
const API_URL = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';

/**
 * Trigger genérico para flujos de N8N (WhatsApp, SMS, Email Marketing)
 */
export const triggerN8NWorkflow = async (action: string, appointment: Appointment) => {
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

export const sendWhatsAppConfirmation = async (appointment: Appointment, preferences?: NotificationPreferences) => {
  if (preferences && !preferences.whatsapp) return { skipped: true };
  if (!appointment.clientPhone) throw new Error("No phone number available");
  return triggerN8NWorkflow('SEND_WHATSAPP', appointment);
};

export const sendSMSReminder = async (appointment: Appointment, preferences?: NotificationPreferences) => {
  if (preferences && !preferences.sms) return { skipped: true };
  if (!appointment.clientPhone) throw new Error("No phone number available");
  return triggerN8NWorkflow('SEND_SMS', appointment);
};

export const launchCampaign = async (campaign: Campaign) => {
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

export const syncToChatwoot = async (appointment: Appointment) => {
  if (!appointment.clientPhone) return { success: false, message: 'Falta teléfono' };
  try {
    const response = await fetch(`${API_URL}/integrations/chatwoot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    });
    return await response.json();
  } catch (error) {
    return triggerN8NWorkflow('SYNC_CRM_FALLBACK', appointment);
  }
};
