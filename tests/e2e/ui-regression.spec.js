import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
];

async function openPreviewSession(page) {
  await page.goto('/#/login');
  await expect(page.locator('#email-login-form')).toBeVisible({ timeout: 30000 });
  await page.locator('#btn-dev-bypass').click();
  await expect(page.locator('#app-layout')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#page-root')).not.toBeEmpty();
}

test.describe('UI regression — responsive workspace', () => {
  for (const viewport of viewports) {
    test(`${viewport.name}: shell fits viewport and navigation remains available`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openPreviewSession(page);

      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(dimensions.document, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
      expect(dimensions.body, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);

      // Bottom navigation is a phone-only affordance; tablet keeps the sidebar
      // navigation and its desktop collapse control.
      if (viewport.width <= 768) {
        await expect(page.locator('.bottom-nav')).toBeVisible();
        await page.locator('#sidebar-toggle').click();
        await expect(page.locator('#app-sidebar')).toHaveClass(/show/);
        await page.locator('#sidebar-backdrop').click({ force: true });
      } else {
        await expect(page.locator('#sidebar-toggle-desktop')).toBeVisible();
        await page.locator('#sidebar-toggle-desktop').click();
        await expect(page.locator('#app-layout')).toHaveClass(/sidebar-collapsed/);
      }
    });
  }
});

test('login form validates required fields without sending credentials', async ({ page }) => {
  await page.goto('/#/login');
  await expect(page.locator('#email-login-form')).toBeVisible({ timeout: 30000 });
  await page.locator('#btn-email-signin').click();
  await expect(page.locator('#email-error')).toBeVisible();
  await expect(page.locator('#pass-error')).toBeVisible();
  await expect(page.locator('#login-email')).toHaveClass(/error/);
  await expect(page.locator('#login-pass')).toHaveClass(/error/);
});

test('workspace routes render and inspection routes are registered', async ({ page }) => {
  await openPreviewSession(page);

  const inspectionRoutes = [
    'checklist',
    'electrical-inspection',
    'fire-protection',
    'water-inspection',
    'wastewater-inspection',
    'stormwater',
    'sanitation-inspection',
    'environmental',
  ];
  const workspaceRoutes = ['dashboard', 'proyek', 'laporan', 'files', 'galeri', 'simulation', 'settings'];
  const navigableWorkspaceRoutes = ['dashboard', 'proyek', 'laporan'];

  // Inspection pages require a real project context and backend data. Verify
  // their route handlers are registered without fabricating a project record
  // or changing the app's data/authorization behavior.
  const registeredRoutes = await page.evaluate(async () => {
    const { listRoutes } = await import('/src/lib/router.js');
    return listRoutes();
  });
  expect(registeredRoutes).toEqual(expect.arrayContaining([...workspaceRoutes, ...inspectionRoutes]));

  // Sebagian halaman workspace (berkas, galeri, simulasi, pengaturan) dapat
  // menerapkan guard berbasis izin/konteks. Uji navigasi aktual pada rute inti
  // yang tidak membutuhkan konteks tambahan; rute lain diverifikasi melalui
  // registry di atas agar pengujian tidak menyamar sebagai pengguna berizin.
  for (const route of navigableWorkspaceRoutes) {
    await page.evaluate((path) => { window.location.hash = `#/${path}`; }, route);
    await expect.poll(() => page.evaluate(() => window.location.hash)).toBe(`#/${route}`);
    await expect(page.locator('#page-root')).not.toContainText('Halaman Tidak Ditemukan', { timeout: 15000 });
  }
});

test('dark appearance tokens and light restoration are applied consistently', async ({ page }) => {
  await openPreviewSession(page);

  const light = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--bg-base').trim());
  expect(light).toBe('#f5f5f7');

  await page.evaluate(() => document.body.setAttribute('data-theme', 'dark'));
  const dark = await page.evaluate(() => ({
    background: getComputedStyle(document.body).getPropertyValue('--bg-base').trim(),
    scheme: getComputedStyle(document.body).colorScheme,
  }));
  expect(dark.background).toBe('#101114');
  expect(dark.scheme).toBe('dark');

  await page.evaluate(() => document.body.removeAttribute('data-theme'));
  const restored = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--bg-base').trim());
  expect(restored).toBe(light);
});

test('dialog and toast can be opened and dismissed accessibly', async ({ page }) => {
  await openPreviewSession(page);

  await page.evaluate(async () => {
    const { openModal } = await import('/src/components/modal.js');
    openModal({ title: 'Uji dialog', body: 'Konten dialog untuk pengujian.' });
  });
  const dialog = page.getByRole('dialog', { name: 'Uji dialog' });
  await expect(dialog).toBeVisible();
  // makeDialog memindahkan fokus ke dalam dialog; elemen fokus awal dapat
  // berupa dialog itu sendiri atau kontrol pertama yang terlihat.
  await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  await page.evaluate(async () => {
    const { toast } = await import('/src/components/toast.js');
    toast('Notifikasi uji', 'success', 0);
  });
  const notification = page.getByRole('status').filter({ hasText: 'Notifikasi uji' });
  await expect(notification).toBeVisible();
  await notification.getByRole('button', { name: 'Tutup notifikasi' }).click();
  // Toast menjalankan animasi keluar 400 ms sebelum node dilepas dari DOM.
  // Pastikan langsung masuk status hide, lalu tunggu pelepasan aktualnya.
  await expect(notification).toHaveClass(/hide/);
  await expect(notification).toHaveCount(0, { timeout: 1500 });
});
