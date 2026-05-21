import { test, expect } from '@playwright/test';

test.describe('Booking E2E Flow', () => {
    test('should load the landing page and have correct SEO tags', async ({ page }) => {
        // 1. Visit the home page
        await page.goto('/');

        // 2. Validate SEO Meta Tags
        await expect(page).toHaveTitle(/CitaPlanner|Luxury Suite|Cargando/);

        const descriptionMeta = await page.locator('meta[name="description"]').getAttribute('content');
        expect(descriptionMeta).toContain('CitaPlanner');

        const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');
        expect(robotsMeta).toBe('index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
        expect(ogTitle).toContain('CitaPlanner');
    });

    test('should verify the API health and config endpoints from the browser context', async ({ page }) => {
        // 1. Visit the landing page to load the context
        await page.goto('/');

        // 2. Fetch landing settings directly within the browser context
        const response = await page.evaluate(async () => {
            const res = await fetch('/api/settings/landing');
            return {
                status: res.status,
                data: await res.json()
            };
        });

        expect(response.status).toBe(200);
        expect(response.data.value).toHaveProperty('businessName');
    });
});
