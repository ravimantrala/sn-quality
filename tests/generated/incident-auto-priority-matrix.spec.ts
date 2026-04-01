import { test, expect } from "@playwright/test";

// baseURL is set in playwright.config.ts — use relative paths with request

test.describe("Incident Auto-Priority Assignment Based on Impact and Urgency", () => {
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

  test("High Impact + High Urgency = Critical Priority (P1)", async ({ request }) => {

  });

  test("High Impact + Medium Urgency = High Priority (P2)", async ({ request }) => {

  });

  test("High Impact + Low Urgency = Moderate Priority (P3)", async ({ request }) => {

  });

  test("Medium Impact + High Urgency = High Priority (P2)", async ({ request }) => {

  });

  test("Medium Impact + Medium Urgency = Moderate Priority (P3)", async ({ request }) => {

  });

  test("Medium Impact + Low Urgency = Low Priority (P4)", async ({ request }) => {

  });

  test("Low Impact + High Urgency = Moderate Priority (P3)", async ({ request }) => {

  });

  test("Low Impact + Medium Urgency = Low Priority (P4)", async ({ request }) => {

  });

  test("Low Impact + Low Urgency = Planning Priority (P5)", async ({ request }) => {

  });

});
