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
    let testBranch;
    let flowAppointmentId;

    beforeAll(async () => {
        // Create test branch
        testBranch = await prisma.branch.create({
            data: {
                name: 'Test Branch Flows',
                address: 'Calle Falsa 123',
                phone: '1234567890',
                status: 'ACTIVE'
            }
        });

        // Create test professional
        testProfessional = await prisma.professional.create({
            data: {
                name: 'Test Pro Integration',
                email: 'testpro@integration.com',
                branchId: testBranch.id,
                weeklySchedule: JSON.stringify([
                    { dayOfWeek: 1, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
                    { dayOfWeek: 2, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
                    { dayOfWeek: 3, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
                    { dayOfWeek: 4, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
                    { dayOfWeek: 5, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
                    { dayOfWeek: 6, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] },
                    { dayOfWeek: 0, isEnabled: true, slots: [{ start: '09:00', end: '18:00' }] }
                ])
            }
        });

        // Create test service
        testService = await prisma.service.create({
            data: {
                name: 'Test Service Integration',
                price: 100.0,
                duration: 60,
                category: 'Cabello',
                branchId: testBranch.id,
                status: 'ACTIVE'
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
        if (flowAppointmentId) {
            await prisma.appointment.deleteMany({ where: { id: flowAppointmentId } });
        }
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
        if (testBranch) {
            await prisma.branch.deleteMany({ where: { id: testBranch.id } });
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
        
    });

    describe('Dynamic SEO Meta Injection', () => {
        it('GET / dynamically injects LandingSetting SEO values into HTML', async () => {
            let landing = await prisma.landingSetting.findFirst({
                where: { templateId: 'shulastudio' }
            });
            if (!landing) {
                landing = await prisma.landingSetting.findFirst({
                    where: { businessName: { contains: 'shula', mode: 'insensitive' } }
                });
            }
            if (!landing) {
                landing = await prisma.landingSetting.findFirst();
            }

            const res = await request(app).get('/');
            expect(res.status).toBe(200);
            expect(res.text).toContain('<title>');
            if (landing) {
                let expectedTitle = landing.seoTitle || landing.businessName;
                expectedTitle = expectedTitle.replace(/^["'\s\\]+|["'\s\\]+$/g, '');
                expect(res.text).toContain(expectedTitle);
                
                let expectedDesc = landing.seoDescription || landing.slogan || landing.aboutText;
                if (expectedDesc) {
                    expectedDesc = expectedDesc.replace(/^["'\s\\]+|["'\s\\]+$/g, '');
                    expect(res.text).toContain(expectedDesc);
                }
            }
        });
    });

    describe('WhatsApp Flows Webhook Logic', () => {
        it('GET /api/webhooks/whatsapp-flows returns active status page', async () => {
            const res = await request(app).get('/api/webhooks/whatsapp-flows');
            expect(res.status).toBe(200);
            expect(res.text).toContain('ACTIVE');
        });

        it('POST /api/webhooks/whatsapp-flows handles ping action', async () => {
            const res = await request(app)
                .post('/api/webhooks/whatsapp-flows')
                .send({
                    decrypted_body_test: {
                        action: 'ping'
                    }
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.payload.status).toBe('active');
        });

        it('POST /api/webhooks/whatsapp-flows routes screen SELECT_BRANCH', async () => {
            const res = await request(app)
                .post('/api/webhooks/whatsapp-flows')
                .send({
                    decrypted_body_test: {
                        action: 'data_exchange',
                        screen: 'SELECT_BRANCH'
                    }
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.payload.screen).toBe('SELECT_BRANCH');
            expect(res.body.payload.data.branches).toBeDefined();
            const found = res.body.payload.data.branches.find(b => b.id === testBranch.id);
            expect(found).toBeDefined();
            expect(found.title).toBe(testBranch.name);
        });

        it('POST /api/webhooks/whatsapp-flows routes screen SELECT_SERVICE', async () => {
            const res = await request(app)
                .post('/api/webhooks/whatsapp-flows')
                .send({
                    decrypted_body_test: {
                        action: 'data_exchange',
                        screen: 'SELECT_SERVICE',
                        data: {
                            branch_id: testBranch.id
                        }
                    }
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.payload.screen).toBe('SELECT_SERVICE');
            const found = res.body.payload.data.services.find(s => s.id === testService.id);
            expect(found).toBeDefined();
            expect(found.title).toContain(testService.name);
        });

        it('POST /api/webhooks/whatsapp-flows routes screen SELECT_PROFESSIONAL', async () => {
            const res = await request(app)
                .post('/api/webhooks/whatsapp-flows')
                .send({
                    decrypted_body_test: {
                        action: 'data_exchange',
                        screen: 'SELECT_PROFESSIONAL',
                        data: {
                            branch_id: testBranch.id,
                            service_id: testService.id
                        }
                    }
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.payload.screen).toBe('SELECT_PROFESSIONAL');
            const found = res.body.payload.data.professionals.find(p => p.id === testProfessional.id);
            expect(found).toBeDefined();
            expect(found.title).toBe(testProfessional.name);
        });

        it('POST /api/webhooks/whatsapp-flows routes screen SELECT_DATE_TIME for slot listing', async () => {
            const res = await request(app)
                .post('/api/webhooks/whatsapp-flows')
                .send({
                    decrypted_body_test: {
                        action: 'data_exchange',
                        screen: 'SELECT_DATE_TIME',
                        data: {
                            branch_id: testBranch.id,
                            service_id: testService.id,
                            professional_id: testProfessional.id,
                            date: '2026-06-15'
                        }
                    }
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.payload.screen).toBe('SELECT_DATE_TIME');
            expect(res.body.payload.data.time_slots).toBeDefined();
            expect(res.body.payload.data.time_slots.length).toBeGreaterThan(0);
        });

        it('POST /api/webhooks/whatsapp-flows routes screen SELECT_DATE_TIME for confirmation screen transition', async () => {
            const res = await request(app)
                .post('/api/webhooks/whatsapp-flows')
                .send({
                    decrypted_body_test: {
                        action: 'data_exchange',
                        screen: 'SELECT_DATE_TIME',
                        data: {
                            branch_id: testBranch.id,
                            service_id: testService.id,
                            professional_id: testProfessional.id,
                            date: '2026-06-15',
                            time_slot: '10:00'
                        }
                    }
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.payload.screen).toBe('CONFIRM_BOOKING');
            expect(res.body.payload.data.branch_name).toBe(testBranch.name);
            expect(res.body.payload.data.professional_name).toBe(testProfessional.name);
            expect(res.body.payload.data.service_name).toContain(testService.name);
        });

        it('POST /api/webhooks/whatsapp-flows processes action complete to book real appointment', async () => {
            const res = await request(app)
                .post('/api/webhooks/whatsapp-flows')
                .send({
                    decrypted_body_test: {
                        action: 'complete',
                        flow_token: 'TestFlowToken123',
                        data: {
                            branch_id: testBranch.id,
                            service_id: testService.id,
                            professional_id: testProfessional.id,
                            date: '2026-06-15',
                            time_slot: '10:00',
                            client_name: 'Flow Tester Client',
                            client_phone: '521555555555'
                        }
                    }
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.payload.screen).toBe('SUCCESS_SCREEN');
            expect(res.body.payload.data.appointment_id).toBeDefined();

            flowAppointmentId = res.body.payload.data.appointment_id;

            // Verify booking exists in real PostgreSQL database via Prisma
            const appointment = await prisma.appointment.findUnique({
                where: { id: flowAppointmentId }
            });
            expect(appointment).not.toBeNull();
            expect(appointment.clientName).toBe('Flow Tester Client');
            expect(appointment.clientPhone).toBe('521555555555');
            expect(appointment.status).toBe('SCHEDULED');
            expect(appointment.description).toContain('WhatsApp Flow');
        });
    });
});

