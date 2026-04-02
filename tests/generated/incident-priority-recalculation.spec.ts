import { test, expect } from "@playwright/test";
import "dotenv/config";

test.describe("Priority Recalculates When Impact or Urgency Changes", () => {
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

  test("Priority upgrades when urgency is raised on existing incident", /* @Escalation */ async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
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
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    expect(created.priority).toBe("4");
    // Update incident record
    const updatedRes = await request.patch(`/api/now/table/incident/${created.sys_id}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "urgency": "1"
      },
    });
    expect(updatedRes.ok()).toBeTruthy();
    const updated = (await updatedRes.json()).result;

    // TODO: I save the form
    expect(updated.priority).toBe("2");
  });

  test("Priority upgrades when impact is raised on existing incident", /* @Escalation */ async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
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
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    expect(created.priority).toBe("5");
    // Update incident record
    const updatedRes = await request.patch(`/api/now/table/incident/${created.sys_id}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "impact": "1"
      },
    });
    expect(updatedRes.ok()).toBeTruthy();
    const updated = (await updatedRes.json()).result;

    // TODO: I save the form
    expect(updated.priority).toBe("3");
  });

  test("Priority jumps to Critical when both impact and urgency are raised", /* @Escalation @Critical */ async ({ request }) => {
    // Create incident record
    const createdRes = await request.post(`/api/now/table/incident`, {
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
    expect(createdRes.ok()).toBeTruthy();
    const created = (await createdRes.json()).result;

    createdIds.push({ table: "incident", id: created.sys_id });
    expect(created.priority).toBe("5");
    // Update incident record
    const updatedRes = await request.patch(`/api/now/table/incident/${created.sys_id}`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
            "impact": "1",
            "urgency": "1"
      },
    });
    expect(updatedRes.ok()).toBeTruthy();
    const updated = (await updatedRes.json()).result;

    // TODO: I save the form
    expect(updated.priority).toBe("1");
  });

});
