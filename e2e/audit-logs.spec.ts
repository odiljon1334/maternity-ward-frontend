import { expect, test } from '@playwright/test';

test('audit filters, Toshkent time, full details and fetch failure', async ({ page, baseURL }) => {
  const user = { id: 'audit-admin', username: 'superadmin', role: 'SUPER_ADMIN', lang: 'uz', hospitalId: null };
  await page.context().addCookies([{ name: 'access_token', value: 'test', url: baseURL!, httpOnly: true }]);
  await page.addInitScript((user) => localStorage.setItem('auth-storage', JSON.stringify({ state: { user, selectedHospital: null }, version: 2 })), user);
  let fail = false;
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/audit-logs')) {
      if (fail) return route.fulfill({ status: 500, json: { message: 'test failure' } });
      return route.fulfill({ json: { data: { records: [{ id: 'audit-full-id', action: 'LOGIN_FAILED', entity: 'User', userId: null, entityId: null, ip: '203.0.113.1', createdAt: '2026-10-21T21:00:00Z', details: { username: 'unknown-login', reason: 'user_not_found', note: 'Full detail survives without truncation' } }], total: 1, page: 1, pages: 1, limit: 20 } } });
    }
    return route.fulfill({ json: { data: url.pathname.endsWith('/auth/profile') ? user : url.pathname.endsWith('/notifications/unread-count') ? 0 : [] } });
  });
  await page.goto('/dashboard/audit-logs');
  await expect(page.getByText('Kiritilgan login', { exact: true })).toBeVisible();
  await expect(page.getByText('Bunday login topilmadi')).toBeVisible();
  await expect(page.getByRole('cell', { name: /02:00:00/ })).toBeVisible();
  await page.getByRole('button', { name: 'Yozuv tafsilotlari: audit-full-id' }).click();
  await expect(page.getByRole('dialog')).toContainText('Full detail survives without truncation');
  await page.keyboard.press('Escape');
  await page.getByLabel('Boshlanish sanasi').fill('2026-10-22');
  await page.getByLabel('Tugash sanasi').fill('2026-10-22');
  const req = page.waitForRequest(r => r.url().includes('/audit-logs?') && new URL(r.url()).searchParams.get('from') === '2026-10-21T19:00:00.000Z');
  await page.getByRole('button', { name: 'Qidirish', exact: true }).click();
  const sent = new URL((await req).url());
  expect(sent.searchParams.get('to')).toBe('2026-10-22T18:59:59.999Z');
  await expect(page.getByText('Bunday login topilmadi')).toBeVisible();
  await page.screenshot({ path: '/tmp/staffplus-audit-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => { const b = await page.locator('aside').boundingBox(); return b ? Math.round(b.x + b.width) : 0; }).toBeLessThanOrEqual(0);
  await page.screenshot({ path: '/tmp/staffplus-audit-mobile.png', fullPage: true });
  fail = true;
  await page.getByRole('button', { name: 'Yangilash', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Ma’lumot yuklanmadi' })).toContainText('Ma’lumot yuklanmadi', { timeout: 20000 });
  await expect(page.getByText('Hech qanday yozuv topilmadi')).toHaveCount(0);
});
