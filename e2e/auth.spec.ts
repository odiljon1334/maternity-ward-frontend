import { expect, test, type Page } from "@playwright/test";

const testUser = {
  id: "e2e-super-admin",
  username: "superadmin",
  role: "SUPER_ADMIN",
  lang: "uz",
  hospitalId: null,
  hospital: null,
  employee: null,
  email: "admin@example.test",
  emailVerifiedAt: "2026-10-03T00:00:00.000Z",
};

async function mockAuthenticatedApi(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname.endsWith("/auth/login") && request.method() === "POST") {
      expect(request.postDataJSON()).toEqual({
        username: "superadmin",
        password: "test-password",
      });

      return route.fulfill({
        status: 201,
        contentType: "application/json",
        headers: {
          "set-cookie": "access_token=e2e-session; Path=/; HttpOnly; SameSite=Lax",
        },
        body: JSON.stringify({ data: { user: testUser } }),
      });
    }

    if (pathname.endsWith("/auth/profile")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: testUser }),
      });
    }

    const dataByPath: Record<string, unknown> = {
      "/api/v1/dashboard/overview": {
        todayPresent: 0,
        todayAbsent: 0,
        todayLate: 0,
        attendanceRate: 0,
        totalEmployees: 0,
        monthlyPayroll: 0,
      },
      "/api/v1/dashboard/trend": [],
      "/api/v1/dashboard/top-late": [],
      "/api/v1/dashboard/departments": [],
      "/api/v1/notifications": [],
      "/api/v1/notifications/unread-count": 0,
      "/api/v1/telegram/status": { connected: false },
    };

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: dataByPath[pathname] ?? [] }),
    });
  });
}

test("sessiyasiz dashboard login sahifasiga qaytaradi", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard$/);
  await expect(page.getByRole("heading", { name: /Xush kelibsiz/i })).toBeVisible();
});

test("muvaffaqiyatli login dashboardda qoladi", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await mockAuthenticatedApi(page);
  await page.goto("/login");
  // Playwright route.fulfill Set-Cookie'ni haqiqiy tarmoq javobidek cookie
  // omboriga yozmaydi. Backend yaratadigan HttpOnly sessiyani shu yerda
  // brauzer contextida ifodalaymiz; login UI va Next middleware esa real.
  await page.context().addCookies([
    {
      name: "access_token",
      value: "e2e-session",
      url: new URL(page.url()).origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  await page.getByLabel("Foydalanuvchi nomi").fill("superadmin");
  await page.getByLabel("Parol", { exact: true }).fill("test-password");
  const loginResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/v1/auth/login"),
  );
  await page.getByRole("button", { name: "Kirish", exact: true }).click();
  const response = await loginResponse;
  expect(response.ok()).toBe(true);
  await expect(response.json()).resolves.toEqual({ data: { user: testUser } });
  expect(pageErrors).toEqual([]);
  await expect(page.getByText("Xush kelibsiz!", { exact: true })).toBeVisible();
  await expect(page.getByText("Login yoki parol noto'g'ri", { exact: true })).toHaveCount(0);

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 45_000 });
  await expect(page.getByText("Boshqaruv Paneli", { exact: true })).toBeVisible();
  await expect(page.getByText("Xush kelibsiz 👋", { exact: true })).toHaveCount(0);
});
