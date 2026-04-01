import { test, expect } from "@playwright/test";

// baseURL is set in playwright.config.ts — use relative paths with request

test.describe("Priority Recalculates When Impact or Urgency Changes", () => {
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

  test("Priority upgrades when urgency is raised on existing incident", /*  @Escalation */ async ({ request }) => {
    // Create incident
    const createRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Recalc test — urgency change",
            "impact": "2",
            "urgency": "3",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()).result;
    createdIds.push(created.sys_id);

    expect(created.priority).toBe("4");
    // Update incident
    const updateRes = await request.patch(`/api/now/table/incident/${created.sys_id}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "urgency": "1"
      },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = (await updateRes.json()).result;

    expect(updated.priority).toBe("2");
  });

  test("Priority upgrades when impact is raised on existing incident", /*  @Escalation */ async ({ request }) => {
    // Create incident
    const createRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Recalc test — impact change",
            "impact": "3",
            "urgency": "3",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()).result;
    createdIds.push(created.sys_id);

    expect(created.priority).toBe("5");
    // Update incident
    const updateRes = await request.patch(`/api/now/table/incident/${created.sys_id}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "impact": "1"
      },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = (await updateRes.json()).result;

    expect(updated.priority).toBe("3");
  });

  test("Priority jumps to Critical when both impact and urgency are raised", /*  @Escalation @Critical */ async ({ request }) => {
    // Create incident
    const createRes = await request.post(`/api/now/table/incident`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "caller_id": "Abel Tuter",
            "short_description": "Recalc test — double escalation",
            "impact": "3",
            "urgency": "3",
            "category": "Software",
            "assignment_group": "Service Desk"
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()).result;
    createdIds.push(created.sys_id);

    expect(created.priority).toBe("5");
    // Update incident
    const updateRes = await request.patch(`/api/now/table/incident/${created.sys_id}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "impact": "1",
            "urgency": "1"
      },
    });
    expect(updateRes.ok()).toBeTruthy();
    const updated = (await updateRes.json()).result;

    expect(updated.priority).toBe("1");
  });

});
