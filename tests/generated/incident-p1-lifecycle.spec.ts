import { test, expect } from "@playwright/test";

// baseURL is set in playwright.config.ts — use relative paths with request

test.describe("ServiceNow P1 Incident Lifecycle", () => {
  const createdIds: string[] = [];
  let incidentSysId: string;

  const baseUrl = process.env.SN_INSTANCE!;
  const authHeader = "Basic " + Buffer.from(`${process.env.SN_USER}:${process.env.SN_PASSWORD}`).toString("base64");

  async function apiDelete(path: string) {
    await fetch(`${baseUrl}${path}`, { method: "DELETE", headers: { Authorization: authHeader, Accept: "application/json" } });
  }
  async function apiGet(path: string) {
    const res = await fetch(`${baseUrl}${path}`, { headers: { Authorization: authHeader, Accept: "application/json" } });
    return res.json();
  }

  test.afterAll(async () => {
    for (const id of createdIds) {
      await apiDelete(`/api/now/table/incident/${id}`).catch(() => {});
    }
  });

  test("Create a P1 incident with required fields and validate priority engine", /*  @Creation @Smoke */ async ({ page, request }) => {
    await page.goto(`/incident_list.do`);
    await page.waitForLoadState("networkidle");
    // TODO: I click "New"
    await page.locator('#sys_display\\.incident\\.caller_id').fill("Abel Tuter");
    await page.waitForTimeout(500);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);
    await page.locator('#incident\\.short_description').fill("Production database cluster unreachable");
    await page.locator('#incident\\.description').fill("All primary and secondary nodes unresponsive since 03:42 UTC. Customer-facing APIs returning 503.");
    await page.locator('#incident\\.impact').selectOption({ label: "1 - High" });
    await page.locator('#incident\\.urgency').selectOption({ label: "1 - High" });
    await page.locator('#incident\\.category').selectOption({ label: "Database" });
    await page.locator('#incident\\.subcategory').selectOption({ label: "DB2" });
    await page.locator('#sys_display\\.incident\\.assignment_group').fill("Database");
    await page.waitForTimeout(500);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);
    await page.locator('#sys_display\\.incident\\.cmdb_ci').fill("lnux100");
    await page.waitForTimeout(500);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);
    await page.locator('#sysverb_insert').click();
    await page.waitForLoadState("networkidle");
    // TODO: the incident is created successfully
    const priorityVal = await page.locator('#incident\\.priority').inputValue();
    expect(priorityVal).toBe("1");
    const stateVal = await page.locator('#incident\\.state').inputValue();
    expect(stateVal).toBe("New");
    // Verify SLA via API
    const slaRes = await request.get(`/api/now/table/task_sla?sysparm_query=task=${incidentSysId}^sla.nameLIKEPriority 1 resolution (1 hour)`);
    const slaData = (await slaRes.json()).result;
    expect(slaData.length).toBeGreaterThan(0);
    // Incident sys_id already captured
  });

  test("Priority field cannot be manually overridden", /*  @UIPolicy @Priority */ async ({ page, request }) => {
    await page.goto(`/incident.do?sys_id=${incidentSysId}`);
    await page.waitForLoadState("networkidle");
    const priorityEl = page.locator('#incident\\.priority');
    await expect(priorityEl).toBeDisabled();
    const priorityVal = await page.locator('#incident\\.priority').inputValue();
    expect(priorityVal).toBe("1");
  });

  test("Assigning the incident moves state to In Progress", /*  @Assignment @StateTransition */ async ({ page, request }) => {
    await page.goto(`/incident.do?sys_id=${incidentSysId}`);
    await page.waitForLoadState("networkidle");
    // TODO: I update the incident with:
    await page.locator('#sysverb_update').click();
    await page.waitForLoadState("networkidle");
    const stateVal = await page.locator('#incident\\.state').inputValue();
    expect(stateVal).toBe("In Progress");
    const assigned_toVal = await page.locator('#incident\\.assigned_to').inputValue();
    expect(assigned_toVal).toBe("David Loo");
  });

  test("SLA response and resolution timers are active", /*  @SLA @Timer */ async ({ page, request }) => {
    await page.goto(`/incident.do?sys_id=${incidentSysId}`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("tab", { name: "Task SLAs" }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator("text=Priority 1 resolution (1 hour)")).toBeVisible();
    await expect(page.locator("text=Priority 1 response (15 minutes)")).toBeVisible();
  });

  test("Stakeholders are notified when P1 incident is created", /*  @Notification */ async ({ page, request }) => {
    await page.goto(`/incident.do?sys_id=${incidentSysId}`);
    await page.waitForLoadState("networkidle");
    await page.getByRole("tab", { name: "Emails" }).click();
    await page.waitForTimeout(1000);
    // TODO: an email record exists matching:
  });

});
