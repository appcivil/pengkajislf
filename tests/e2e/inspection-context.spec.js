import { test, expect } from '@playwright/test';

const projectId = 'eeeeeeee-1111-4eee-8eee-eeeeeeeeeeee';

test.skip(!process.env.VITE_SUPABASE_URL, 'requires the disposable local Supabase integration environment');

test('authorized owner can navigate to electrical inspection for a real tenant project', async ({ page }) => {
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

  expect(signedInUserId).toBe('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee');
  await expect.poll(() => page.evaluate(async () => {
    const auth = await import('/src/lib/auth.js');
    return auth.isAuthenticated();
  })).toBe(true);

  await page.evaluate((id) => {
    window.location.hash = `#/electrical-inspection?id=${encodeURIComponent(id)}`;
  }, projectId);

  await expect(page.locator('#electrical-inspection-page')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#electrical-main-card')).toContainText('Pemeriksaan Sistem Kelistrikan');
  await expect(page.locator('#electrical-main-card')).toContainText('PUIL 2020');
  await expect(page.locator('#page-root')).not.toContainText('Halaman Tidak Ditemukan');
});
