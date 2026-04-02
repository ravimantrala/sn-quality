import { test, expect } from "@playwright/test";
import "dotenv/config";

test.describe("Incident Auto-Priority Assignment Matrix", () => {
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

  test("Priority is calculated from impact and urgency (impact=1 - High, urgency=1 - High, expected_priority=1 - Critical)", async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Priority matrix test — impact 1 - High, urgency 1 - High",
            "impact": "1",
            "urgency": "1",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    // TODO: I submit the form
    // Record creation verified by API response
    expect(created.priority).toBe("1");
    // Record tracked for cleanup
    expect(created.priority).toBe("1");
  });

  test("Priority is calculated from impact and urgency (impact=1 - High, urgency=2 - Medium, expected_priority=2 - High)", async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Priority matrix test — impact 1 - High, urgency 2 - Medium",
            "impact": "1",
            "urgency": "2",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    // TODO: I submit the form
    // Record creation verified by API response
    expect(created.priority).toBe("2");
    // Record tracked for cleanup
    expect(created.priority).toBe("2");
  });

  test("Priority is calculated from impact and urgency (impact=1 - High, urgency=3 - Low, expected_priority=3 - Moderate)", async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Priority matrix test — impact 1 - High, urgency 3 - Low",
            "impact": "1",
            "urgency": "3",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    // TODO: I submit the form
    // Record creation verified by API response
    expect(created.priority).toBe("3");
    // Record tracked for cleanup
    expect(created.priority).toBe("3");
  });

  test("Priority is calculated from impact and urgency (impact=2 - Medium, urgency=1 - High, expected_priority=2 - High)", async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Priority matrix test — impact 2 - Medium, urgency 1 - High",
            "impact": "2",
            "urgency": "1",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    // TODO: I submit the form
    // Record creation verified by API response
    expect(created.priority).toBe("2");
    // Record tracked for cleanup
    expect(created.priority).toBe("2");
  });

  test("Priority is calculated from impact and urgency (impact=2 - Medium, urgency=2 - Medium, expected_priority=3 - Moderate)", async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Priority matrix test — impact 2 - Medium, urgency 2 - Medium",
            "impact": "2",
            "urgency": "2",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    // TODO: I submit the form
    // Record creation verified by API response
    expect(created.priority).toBe("3");
    // Record tracked for cleanup
    expect(created.priority).toBe("3");
  });

  test("Priority is calculated from impact and urgency (impact=2 - Medium, urgency=3 - Low, expected_priority=4 - Low)", async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Priority matrix test — impact 2 - Medium, urgency 3 - Low",
            "impact": "2",
            "urgency": "3",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    // TODO: I submit the form
    // Record creation verified by API response
    expect(created.priority).toBe("4");
    // Record tracked for cleanup
    expect(created.priority).toBe("4");
  });

  test("Priority is calculated from impact and urgency (impact=3 - Low, urgency=1 - High, expected_priority=3 - Moderate)", async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Priority matrix test — impact 3 - Low, urgency 1 - High",
            "impact": "3",
            "urgency": "1",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    // TODO: I submit the form
    // Record creation verified by API response
    expect(created.priority).toBe("3");
    // Record tracked for cleanup
    expect(created.priority).toBe("3");
  });

  test("Priority is calculated from impact and urgency (impact=3 - Low, urgency=2 - Medium, expected_priority=4 - Low)", async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Priority matrix test — impact 3 - Low, urgency 2 - Medium",
            "impact": "3",
            "urgency": "2",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    // TODO: I submit the form
    // Record creation verified by API response
    expect(created.priority).toBe("4");
    // Record tracked for cleanup
    expect(created.priority).toBe("4");
  });

  test("Priority is calculated from impact and urgency (impact=3 - Low, urgency=3 - Low, expected_priority=5 - Planning)", async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Priority matrix test — impact 3 - Low, urgency 3 - Low",
            "impact": "3",
            "urgency": "3",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    // TODO: I submit the form
    // Record creation verified by API response
    expect(created.priority).toBe("5");
    // Record tracked for cleanup
    expect(created.priority).toBe("5");
  });

});
