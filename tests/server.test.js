import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Server API Checks', () => {
    let testProfessional;
    let testService;
    let testProduct;
    let testAppointment;

    beforeAll(async () => {
        // Create test professional
        testProfessional = await prisma.professional.create({
            data: {
                name: 'Test Pro Integration',
                email: 'testpro@integration.com'
            }
        });

        // Create test service
        testService = await prisma.service.create({
            data: {
                name: 'Test Service Integration',
                price: 100.0,
                duration: 60,
                category: 'Cabello'
            }
        });

        // Create test product (insumo) to test service stock deduction
        testProduct = await prisma.product.create({
            data: {
                name: 'Test Insumo Product',
                price: 20.0,
                cost: 10.0,
                stock: 10,
                minStock: 2,
                category: 'Cabello',
                usage: 'INSU_SERVICIO'
            }
        });
    });

    afterAll(async () => {
        // Teardown all test records in reverse order
        if (testAppointment) {
            await prisma.appointment.deleteMany({ where: { id: testAppointment.id } });
        }
        if (testProduct) {
            await prisma.inventoryMovement.deleteMany({ where: { productId: testProduct.id } });
            await prisma.product.deleteMany({ where: { id: testProduct.id } });
        }
        if (testService) {
            await prisma.service.deleteMany({ where: { id: testService.id } });
        }
        if (testProfessional) {
            await prisma.professional.deleteMany({ where: { id: testProfessional.id } });
        }
        await prisma.$disconnect();
    });

    it('GET /api/settings/landing returns 200 via Prisma', async () => {
        const res = await request(app).get('/api/settings/landing');
        expect(res.status).toBe(200);
        expect(res.body.value).toHaveProperty('businessName');
    });

    it('POST /api/appointments creates a new appointment', async () => {
        const payload = {
            title: 'Cita de Prueba E2E',
            startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            endDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
            clientName: 'Cliente Prueba E2E',
            clientPhone: '+521234567890',
            professionalId: testProfessional.id,
            serviceId: testService.id,
            notes: 'Notas de la cita'
        };

        const res = await request(app)
            .post('/api/appointments')
            .send(payload);

        if (res.status !== 200) {
            console.log('CREATE APPOINTMENT FAILED:', res.status, res.body);
        }

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('id');

        // Fetch to verify and keep reference
        testAppointment = await prisma.appointment.findUnique({
            where: { id: res.body.id }
        });
        expect(testAppointment).not.toBeNull();
        expect(testAppointment.title).toBe(payload.title);
    });

    it('POST /api/appointments/:id/predict-no-show runs Gemini risk prediction', async () => {
        expect(testAppointment).toBeDefined();

        const res = await request(app)
            .post(`/api/appointments/${testAppointment.id}/predict-no-show`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.appointment).toHaveProperty('noShowRisk');
    });

    it('PUT /api/appointments/:id updates appointment and deducts stock on COMPLETED', async () => {
        expect(testAppointment).toBeDefined();

        // 1. Initial product stock should be 10
        const initialProduct = await prisma.product.findUnique({
            where: { id: testProduct.id }
        });
        expect(initialProduct.stock).toBe(10);

        // 2. Perform PUT request to complete appointment
        const res = await request(app)
            .put(`/api/appointments/${testAppointment.id}`)
            .send({
                status: 'COMPLETED'
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.appointment.status).toBe('COMPLETED');

        // 3. Verify stock was transaccionalmente deducted to 9 (10 - 1)
        const updatedProduct = await prisma.product.findUnique({
            where: { id: testProduct.id }
        });
        expect(updatedProduct.stock).toBe(9);

        // 4. Verify inventory movement was registered
        const movements = await prisma.inventoryMovement.findMany({
            where: { productId: testProduct.id }
        });
        expect(movements.length).toBe(1);
        expect(movements[0].type).toBe('OUT');
        expect(movements[0].reason).toContain('Servicio Completado');
    });

    it('DELETE /api/appointments/:id deletes the appointment', async () => {
        expect(testAppointment).toBeDefined();

        const res = await request(app)
            .delete(`/api/appointments/${testAppointment.id}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);

        // Verify physically deleted
        const checkAppt = await prisma.appointment.findUnique({
            where: { id: testAppointment.id }
        });
        expect(checkAppt).toBeNull();
        
        // Reset reference so teardown doesn't fail
        testAppointment = null;
    });
});

