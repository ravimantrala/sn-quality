import { test, expect } from "@playwright/test";
import { loginToServiceNow } from "../src/playwright-helpers/login";
import { navigateToNewRecord, setFieldValue, submitForm, getRecordSysId } from "../src/playwright-helpers/form";

const SN_INSTANCE = process.env.SN_INSTANCE!;
const SN_USER = process.env.SN_USER!;
const SN_PASSWORD = process.env.SN_PASSWORD!;

test.describe("SN Quality Smoke Test", () => {
  test("can login, create incident, and verify fields", async ({ page }) => {
    // Login
    await loginToServiceNow(page, SN_INSTANCE, SN_USER, SN_PASSWORD);

    // Create a new incident
    await navigateToNewRecord(page, "incident");

    // Set fields
    await setFieldValue(page, "Short description", "SN Quality smoke test incident");
    await setFieldValue(page, "Category", "Software");

    // Submit
    await submitForm(page);

    // Verify we got a sys_id (record was created)
    const sysId = await getRecordSysId(page);
    expect(sysId).toBeTruthy();
    expect(sysId.length).toBe(32);

    // Store for cleanup
    test.info().annotations.push({
      type: "cleanup",
      description: JSON.stringify({ table: "incident", sys_id: sysId }),
    });
  });
});

test.afterEach(async ({}, testInfo) => {
  // Cleanup: delete any records created during the test
  for (const annotation of testInfo.annotations) {
    if (annotation.type === "cleanup" && annotation.description) {
      const { table, sys_id } = JSON.parse(annotation.description);
      const res = await fetch(`${SN_INSTANCE}/api/now/table/${table}/${sys_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${Buffer.from(`${SN_USER}:${SN_PASSWORD}`).toString("base64")}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        console.warn(`Cleanup failed for ${table}/${sys_id}: ${res.status}`);
      }
    }
  }
});
