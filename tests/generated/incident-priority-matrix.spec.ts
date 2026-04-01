import { test, expect } from "@playwright/test";

// baseURL is set in playwright.config.ts — use relative paths with request

test.describe("Incident Auto-Priority Assignment Matrix", () => {
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

  test("Priority is calculated from impact and urgency (impact=1 - High, urgency=1 - High, expected_priority=1 - Critical)", async ({ request }) => {
    const res = await request.post(`/api/now/table/incident`, {
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
    expect(res.ok()).toBeTruthy();
    const result = (await res.json()).result;
    createdIds.push(result.sys_id);
    expect(result.priority).toBe("1");
  });

  test("Priority is calculated from impact and urgency (impact=1 - High, urgency=2 - Medium, expected_priority=2 - High)", async ({ request }) => {
    const res = await request.post(`/api/now/table/incident`, {
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
    expect(res.ok()).toBeTruthy();
    const result = (await res.json()).result;
    createdIds.push(result.sys_id);
    expect(result.priority).toBe("2");
  });

  test("Priority is calculated from impact and urgency (impact=1 - High, urgency=3 - Low, expected_priority=3 - Moderate)", async ({ request }) => {
    const res = await request.post(`/api/now/table/incident`, {
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
    expect(res.ok()).toBeTruthy();
    const result = (await res.json()).result;
    createdIds.push(result.sys_id);
    expect(result.priority).toBe("3");
  });

  test("Priority is calculated from impact and urgency (impact=2 - Medium, urgency=1 - High, expected_priority=2 - High)", async ({ request }) => {
    const res = await request.post(`/api/now/table/incident`, {
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
    expect(res.ok()).toBeTruthy();
    const result = (await res.json()).result;
    createdIds.push(result.sys_id);
    expect(result.priority).toBe("2");
  });

  test("Priority is calculated from impact and urgency (impact=2 - Medium, urgency=2 - Medium, expected_priority=3 - Moderate)", async ({ request }) => {
    const res = await request.post(`/api/now/table/incident`, {
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
    expect(res.ok()).toBeTruthy();
    const result = (await res.json()).result;
    createdIds.push(result.sys_id);
    expect(result.priority).toBe("3");
  });

  test("Priority is calculated from impact and urgency (impact=2 - Medium, urgency=3 - Low, expected_priority=4 - Low)", async ({ request }) => {
    const res = await request.post(`/api/now/table/incident`, {
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
    expect(res.ok()).toBeTruthy();
    const result = (await res.json()).result;
    createdIds.push(result.sys_id);
    expect(result.priority).toBe("4");
  });

  test("Priority is calculated from impact and urgency (impact=3 - Low, urgency=1 - High, expected_priority=3 - Moderate)", async ({ request }) => {
    const res = await request.post(`/api/now/table/incident`, {
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
    expect(res.ok()).toBeTruthy();
    const result = (await res.json()).result;
    createdIds.push(result.sys_id);
    expect(result.priority).toBe("3");
  });

  test("Priority is calculated from impact and urgency (impact=3 - Low, urgency=2 - Medium, expected_priority=4 - Low)", async ({ request }) => {
    const res = await request.post(`/api/now/table/incident`, {
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
    expect(res.ok()).toBeTruthy();
    const result = (await res.json()).result;
    createdIds.push(result.sys_id);
    expect(result.priority).toBe("4");
  });

  test("Priority is calculated from impact and urgency (impact=3 - Low, urgency=3 - Low, expected_priority=5 - Planning)", async ({ request }) => {
    const res = await request.post(`/api/now/table/incident`, {
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
    expect(res.ok()).toBeTruthy();
    const result = (await res.json()).result;
    createdIds.push(result.sys_id);
    expect(result.priority).toBe("5");
  });

});
