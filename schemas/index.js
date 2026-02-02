import { z } from 'zod';

export const loginSchema = z.object({
    phone: z.string().min(1, "Phone is required"),
    password: z.string().min(1, "Password is required")
});

export const appointmentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    startDateTime: z.string().datetime("Invalid start date format"),
    endDateTime: z.string().datetime("Invalid end date format"),
    clientName: z.string().optional(),
    clientPhone: z.string().optional(),
    professionalId: z.string().uuid("Invalid professional ID").optional().nullable(),
    serviceId: z.string().uuid("Invalid service ID").optional().nullable(),
    notes: z.string().optional()
});

export const professionalSchema = z.object({
    name: z.string().min(1, "Name is required"),
    role: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal('')),
    weeklySchedule: z.array(z.any()).optional(), // Refining this could be a future step
    serviceIds: z.union([z.string(), z.array(z.string())]).optional() // Can be stringified JSON or array
});

export const saasRegisterSchema = z.object({
    name: z.string().min(3, "Business name is too short"),
    subdomain: z.string().min(3, "Subdomain is too short").regex(/^[a-z0-9-]+$/, "Subdomain must be alphanumeric"),
    adminPhone: z.string().min(5, "Phone is too short"),
    adminPassword: z.string().min(6, "Password must be at least 6 characters")
});
