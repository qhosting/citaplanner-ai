import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

describe('Server API Checks', () => {
    it('GET /api/settings/landing returns 200 via Prisma', async () => {
        const res = await request(app).get('/api/settings/landing');
        if (res.status !== 200) {
            console.error('API Error Response:', res.body);
        }
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('businessName');
    });

    // Skipped because 'dist' folder might not exist yet
    it.skip('GET / returns the index.html (SPA)', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/text\/html/);
    });
});
