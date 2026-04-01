import { test, expect } from "@playwright/test";

// baseURL is set in playwright.config.ts — use relative paths with request

test.describe("Priority Field is Read-Only on Incident Form", () => {
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

  test("Priority field is read-only on new incident", async ({ request }) => {

  });

  test("Priority field is read-only on existing incident", async ({ request }) => {

  });

});
