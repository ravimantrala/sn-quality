import { Page } from "@playwright/test";

export async function loginToServiceNow(
  page: Page,
  instance: string,
  username: string,
  password: string
): Promise<void> {
  await page.goto(`${instance}/login.do`);

  await page.fill("#user_name", username);
  await page.fill("#user_password", password);
  await page.click("#sysverb_login");

  // Wait for navigation to complete
  await page.waitForURL("**/now/nav/ui/classic/params/target/**", {
    timeout: 30000,
  }).catch(() => {
    // Some instances redirect differently — wait for any post-login page
    return page.waitForLoadState("networkidle", { timeout: 30000 });
  });
}

export async function loginAsRole(
  page: Page,
  role: string
): Promise<void> {
  const instance = process.env.SN_INSTANCE!;

  const roleUpper = role.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const username = process.env[`SN_USER_${roleUpper}`] || process.env.SN_USER!;
  const password = process.env[`SN_PASS_${roleUpper}`] || process.env.SN_PASSWORD!;

  await loginToServiceNow(page, instance, username, password);
}
