import { test, expect } from "@playwright/test";
import "dotenv/config";

test.describe("ServiceNow P1 Incident Lifecycle", () => {
  const createdIds: Array<{ table: string; id: string }> = [];

  const baseUrl = process.env.SN_INSTANCE!;
  const authHeader = "Basic " + Buffer.from(`${process.env.SN_USER}:${process.env.SN_PASSWORD}`).toString("base64");

  async function apiDelete(path: string) {
    await fetch(`${baseUrl}${path}`, { method: "DELETE", headers: { Authorization: authHeader, Accept: "application/json" } });
  }

  test.afterAll(async () => {
    for (const rec of createdIds) {
      await apiDelete(`/api/now/table/${rec.table}/${rec.id}`).catch(() => {});
    }
  });

  test("Create a P1 incident with required fields and validate priority engine", /* @Creation @Smoke */ async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Production database cluster unreachable",
            "description": "All primary and secondary nodes unresponsive since 03:42 UTC. Customer-facing APIs returning 503.",
            "impact": "1",
            "urgency": "1",
            "category": "Database",
            "assignment_group": "Database"
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    // TODO: I submit the form
    expect(created.priority).toBe("1");
    expect(created.state).toBe("1");
  });

});
