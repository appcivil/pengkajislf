import { test, expect } from '@playwright/test';

const projectId = 'eeeeeeee-1111-4eee-8eee-eeeeeeeeeeee';

test.skip(!process.env.VITE_SUPABASE_URL, 'requires the disposable local Supabase integration environment');

test('authorized owner can load project detail and hydrate all inspection cards responsively', async ({ page }) => {
  await page.goto('/#/login');
  await expect(page.locator('#email-login-form')).toBeVisible({ timeout: 30000 });

  const signedInUserId = await page.evaluate(async () => {
    const { supabase } = await import('/src/lib/supabase.js');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'ui-inspection-owner@example.test',
      password: 'ci-ui-owner-password',
    });
    if (error) throw new Error(`Fixture sign-in failed: ${error.message}`);
    return data.user?.id;
  });

  expect(signedInUserId).toBeTruthy();
  await expect.poll(() => page.evaluate(async () => {
    const auth = await import('/src/lib/auth.js');
    return auth.isAuthenticated();
  })).toBe(true);

  // Auth state flips before the async app-shell callback has necessarily mounted
  // the router. Wait for its mount point before issuing the protected navigation.
  await page.locator('#page-root').waitFor({ state: 'attached', timeout: 30000 });
  // The app registers lazy route handlers after its authenticated shell boots.
  // A hash change before registration resolves to the 404 handler.
  await expect.poll(() => page.evaluate(async () => {
    const router = await import('/src/lib/router.js');
    return router.listRoutes().includes('electrical-inspection');
  }), { timeout: 30000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => typeof window.navigate)).toBe('function');
  const cssPreloadFailures = [];
  page.on('console', (message) => {
    if (/Unable to preload CSS/i.test(message.text())) cssPreloadFailures.push(message.text());
  });
  page.on('pageerror', (error) => {
    if (/Unable to preload CSS/i.test(error.message)) cssPreloadFailures.push(error.message);
  });

  await page.evaluate((id) => window.navigate('proyek-detail', { id }), projectId);
  await expect(page.locator('#proyek-detail-page')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.risk-pulse-card')).toBeVisible();

  // Hydrate every registered inspection card by bringing it into the viewport.
  const keys = await page.locator('#proyek-detail-page [data-lazy-card]').evaluateAll(
    (nodes) => nodes.map((node) => node.getAttribute('data-lazy-card')).filter(Boolean),
  );
  expect(keys.length).toBeGreaterThan(0);
  for (const key of keys) {
    const shell = page.locator(`#proyek-detail-page [data-lazy-card="${key}"]`);
    if (await shell.count()) await shell.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' })).catch(() => {});
    await expect(page.locator(`#proyek-detail-page [data-lazy-card="${key}"]`)).toHaveCount(0, { timeout: 30000 });
  }
  await expect(page.locator('#proyek-detail-page')).not.toContainText('Memuat modul');
  await expect(page.locator('#proyek-detail-page')).not.toContainText('Modul gagal dimuat');

  // Verify the real rendered page at desktop, tablet, and mobile widths.
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 820, height: 1180 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    const dimensions = await page.locator('#proyek-detail-page').evaluate((element) => ({
      viewport: document.documentElement.clientWidth,
      content: element.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  }

  expect(cssPreloadFailures).toEqual([]);
  await expect(page.locator('#page-root')).not.toContainText('Halaman Tidak Ditemukan');
});
