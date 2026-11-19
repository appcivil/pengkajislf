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

test('logout clears preview session and returns to login', async ({ page }) => {
  await openPreviewSession(page);
  await expect.poll(() => page.evaluate(() => Boolean(localStorage.getItem('slf_dev_user')))).toBe(true);

  await page.locator('#user-card-btn').focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Keluar Akun' });
  await expect(dialog).toBeVisible();
  await page.locator('#confirm-ok').click();

  await expect(page.locator('#email-login-form')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#app-layout')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('slf_dev_user'))).toBeNull();
});

test('dark appearance tokens and light restoration are applied consistently', async ({ page }) => {
  await openPreviewSession(page);

  const light = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--bg-base').trim());
  expect(light).toBe('#f5f5f7');

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const dark = await page.evaluate(() => ({
    background: getComputedStyle(document.body).getPropertyValue('--bg-base').trim(),
    scheme: getComputedStyle(document.body).colorScheme,
  }));
  expect(dark.background).toBe('#101114');
  expect(dark.scheme).toBe('dark');

  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
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
  const notification = page.locator('.toast.toast-success').filter({ hasText: 'Notifikasi uji' });
  await expect(notification).toBeVisible();
  await notification.getByRole('button', { name: 'Tutup notifikasi' }).click();
  // Toast menjalankan animasi keluar 400 ms sebelum node dilepas dari DOM.
  // Pastikan langsung masuk status hide, lalu tunggu pelepasan aktualnya.
  await expect(notification).toHaveClass(/hide/);
  await expect(notification).toHaveCount(0, { timeout: 1500 });
});

test('light surfaces keep readable text while branded controls and dark theme stay intact', async ({ page }) => {
  await openPreviewSession(page);

  const fixture = await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'contrast-regression-fixture';
    host.innerHTML = `
      <section class="card-quartz" style="background:#fff;color:#fff">
        <span id="contrast-card-label" style="color:white">Label kartu</span>
        <button id="contrast-brand-button" style="color:white;background:#1677ed">Aksi</button>
      </section>
      <div id="docx-preview-loading"><span id="contrast-docx-label" style="color:white">Memuat dokumen</span></div>
    `;
    document.querySelector('.app-layout').appendChild(host);
    return true;
  });
  expect(fixture).toBe(true);

  const lightColors = await page.evaluate(() => ({
    card: getComputedStyle(document.querySelector('#contrast-card-label')).color,
    docx: getComputedStyle(document.querySelector('#contrast-docx-label')).color,
    button: getComputedStyle(document.querySelector('#contrast-brand-button')).color,
  }));
  expect(lightColors.card).toBe('rgb(29, 29, 31)');
  expect(lightColors.docx).toBe('rgb(29, 29, 31)');
  expect(lightColors.button).toBe('rgb(255, 255, 255)');

  await page.evaluate(() => document.body.classList.add('dark'));
  const darkColors = await page.evaluate(() => ({
    card: getComputedStyle(document.querySelector('#contrast-card-label')).color,
    docx: getComputedStyle(document.querySelector('#contrast-docx-label')).color,
  }));
  expect(darkColors.card).toBe('rgb(255, 255, 255)');
  expect(darkColors.docx).toBe('rgb(255, 255, 255)');
});
test('light surface contrast matching is case-insensitive for inline white colors', async ({ page }) => {
  await openPreviewSession(page);

  await page.evaluate(() => {
    const host = document.createElement('section');
    host.id = 'contrast-case-fixture';
    host.innerHTML = [
      '<div class="card-quartz">',
      '<span id="contrast-white-case" style="color: White">White keyword</span>',
      '<span id="contrast-hex-case" style="color: #FFFFFF">Hex keyword</span>',
      '<span id="contrast-rgb-case" style="color: RGB(255, 255, 255)">RGB keyword</span>',
      '</div>',
    ].join('');
    document.querySelector('.app-layout').appendChild(host);
  });

  const colors = await page.evaluate(() => [
    '#contrast-white-case',
    '#contrast-hex-case',
    '#contrast-rgb-case',
  ].map((selector) => getComputedStyle(document.querySelector(selector)).color));

  expect(colors).toEqual([
    'rgb(29, 29, 31)',
    'rgb(29, 29, 31)',
    'rgb(29, 29, 31)',
  ]);
});

test('light sidebar active navigation uses readable blue text', async ({ page }) => {
  await openPreviewSession(page);

  await page.evaluate(() => {
    const sidebar = document.querySelector('.app-layout .sidebar');
    const item = document.createElement('a');
    item.className = 'nav-item active';
    item.id = 'contrast-active-nav';
    item.style.background = 'rgba(22,119,237,.11)';
    item.innerHTML = '<span id="contrast-active-nav-label" style="color:white">Navigasi aktif</span>';
    sidebar.appendChild(item);
  });

  const color = await page.locator('#contrast-active-nav-label').evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe('rgb(23, 105, 194)');
});

test('light translucent hover controls retain readable text', async ({ page }) => {
  await openPreviewSession(page);

  await page.evaluate(() => {
    const host = document.createElement('div');
    host.id = 'contrast-hover-fixture';
    host.innerHTML = [
      '<button id="contrast-context-hover" class="ctx-btn">Menu</button>',
      '<button id="contrast-smart-chip" class="smart-ai-chip">AI filter</button>',
    ].join('');
    document.querySelector('.app-layout').appendChild(host);
  });

  await page.locator('#contrast-context-hover').hover();
  const contextColor = await page.locator('#contrast-context-hover').evaluate((el) => getComputedStyle(el).color);
  await page.locator('#contrast-smart-chip').hover();
  const chipColor = await page.locator('#contrast-smart-chip').evaluate((el) => getComputedStyle(el).color);

  expect(contextColor).toBe('rgb(9, 105, 218)');
  expect(chipColor).toBe('rgb(9, 105, 218)');
});


test('shared form, table, badge, empty and loading states follow light and dark tokens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPreviewSession(page);

  await page.evaluate(() => {
    const host = document.createElement('section');
    host.id = 'shared-components-fixture';
    host.innerHTML = `
      <div class="form-group">
        <label class="form-label" for="audit-field">Nama proyek</label>
        <input class="form-input" id="audit-field" value="Uji tampilan">
        <p class="form-hint">Keterangan formulir</p>
      </div>
      <div class="table-container" id="audit-table-wrap">
        <table id="audit-table" style="min-width:560px">
          <thead><tr><th>Komponen</th><th>Status</th></tr></thead>
          <tbody><tr><td>Struktur</td><td><span class="badge badge-laik">Laik</span></td></tr></tbody>
        </table>
      </div>
      <button id="audit-disabled" class="btn btn-primary" disabled>Memproses</button>
      <section class="empty-state" id="audit-empty">
        <div class="empty-icon">i</div>
        <h3 class="empty-title">Belum ada data</h3>
        <p class="empty-desc">Pilih proyek untuk melanjutkan</p>
      </section>
      <div class="loading-skeleton skeleton" id="audit-skeleton"></div>
    `;
    document.querySelector('#page-root').appendChild(host);
  });

  const light = await page.evaluate(() => {
    const get = (selector, property = 'color') => getComputedStyle(document.querySelector(selector))[property];
    const wrap = document.querySelector('#audit-table-wrap');
    return {
      input: get('#audit-field'),
      header: get('#audit-table th'),
      cell: get('#audit-table td'),
      badgeColor: get('#audit-table .badge'),
      badgeBackground: get('#audit-table .badge', 'backgroundColor'),
      tableBorder: get('#audit-table td', 'borderBottomColor'),
      emptyIcon: get('#audit-empty .empty-icon'),
      emptyTitle: get('#audit-empty .empty-title'),
      disabledOpacity: get('#audit-disabled', 'opacity'),
      disabledCursor: get('#audit-disabled', 'cursor'),
      skeletonAnimation: get('#audit-skeleton', 'animationName'),
      tableViewportFits: wrap.getBoundingClientRect().width <= document.documentElement.clientWidth,
      tableCanScroll: wrap.scrollWidth > wrap.clientWidth,
    };
  });

  expect(light.input).not.toBe('rgb(255, 255, 255)');
  expect(light.header).not.toBe('rgba(0, 0, 0, 0)');
  expect(light.cell).not.toBe('rgba(0, 0, 0, 0)');
  expect(light.badgeColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(light.badgeBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(light.tableBorder).not.toBe('rgba(0, 0, 0, 0)');
  expect(light.emptyIcon).not.toBe('rgba(0, 0, 0, 0)');
  expect(light.emptyTitle).not.toBe('rgba(0, 0, 0, 0)');
  expect(light.disabledOpacity).toBe('0.5');
  expect(light.disabledCursor).toBe('not-allowed');
  expect(light.skeletonAnimation).toBe('skeleton-sweep');
  expect(light.tableViewportFits).toBe(true);
  expect(light.tableCanScroll).toBe(true);

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const dark = await page.evaluate(() => ({
    input: getComputedStyle(document.querySelector('#audit-field')).color,
    cell: getComputedStyle(document.querySelector('#audit-table td')).color,
    badgeColor: getComputedStyle(document.querySelector('#audit-table .badge')).color,
    badgeBackground: getComputedStyle(document.querySelector('#audit-table .badge')).backgroundColor,
    tableBorder: getComputedStyle(document.querySelector('#audit-table td')).borderBottomColor,
    emptyIcon: getComputedStyle(document.querySelector('#audit-empty .empty-icon')).color,
  }));
  expect(dark.input).not.toBe('rgba(0, 0, 0, 0)');
  expect(dark.cell).not.toBe('rgba(0, 0, 0, 0)');
  expect(dark.badgeColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(dark.badgeBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(dark.tableBorder).not.toBe('rgba(0, 0, 0, 0)');
  expect(dark.emptyIcon).not.toBe('rgba(0, 0, 0, 0)');

});

test('keyboard focus is visibly indicated on shared controls', async ({ page }) => {
  await openPreviewSession(page);
  await page.evaluate(() => {
    const button = document.createElement('button');
    button.id = 'audit-focus-target';
    button.className = 'btn btn-secondary';
    button.textContent = 'Fokus keyboard';
    document.querySelector('#page-root').appendChild(button);
  });

  await page.keyboard.press('Tab');
  await page.locator('#audit-focus-target').focus();
  const focus = await page.locator('#audit-focus-target').evaluate((el) => ({
    outlineStyle: getComputedStyle(el).outlineStyle,
    outlineWidth: getComputedStyle(el).outlineWidth,
    outlineColor: getComputedStyle(el).outlineColor,
  }));
  expect(focus.outlineStyle).toBe('solid');
  expect(parseFloat(focus.outlineWidth)).toBeGreaterThanOrEqual(2);
  expect(focus.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
});
