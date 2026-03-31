import { Page, expect } from "@playwright/test";

export async function navigateToNewRecord(
  page: Page,
  table: string
): Promise<void> {
  const instance = process.env.SN_INSTANCE!;
  await page.goto(`${instance}/${table}.do?sys_id=-1`);
  await page.waitForLoadState("networkidle");
}

export async function navigateToRecord(
  page: Page,
  table: string,
  sysId: string
): Promise<void> {
  const instance = process.env.SN_INSTANCE!;
  await page.goto(`${instance}/${table}.do?sys_id=${sysId}`);
  await page.waitForLoadState("networkidle");
}

export async function setFieldValue(
  page: Page,
  fieldLabel: string,
  value: string
): Promise<void> {
  // Strategy 1: Standard input field found by label
  const labelElement = page.locator(`label:has-text("${fieldLabel}")`).first();
  const forAttr = await labelElement.getAttribute("for").catch(() => null);

  if (forAttr) {
    const input = page.locator(`#${forAttr}`);
    const tagName = await input.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === "select") {
      await input.selectOption({ label: value });
    } else {
      await input.clear();
      await input.fill(value);
      await input.press("Tab");
    }
    return;
  }

  // Strategy 2: Reference field (has a lookup icon)
  const refInput = page.locator(
    `input[aria-label="${fieldLabel}"], input[placeholder*="${fieldLabel}"]`
  ).first();
  if (await refInput.isVisible().catch(() => false)) {
    await refInput.clear();
    await refInput.fill(value);
    const suggestion = page.locator(".ac_results .ac_item").first();
    await suggestion.waitFor({ timeout: 5000 });
    await suggestion.click();
    return;
  }

  throw new Error(`Could not find field with label "${fieldLabel}"`);
}

export async function getFieldDisplayValue(
  page: Page,
  fieldLabel: string
): Promise<string> {
  const labelElement = page.locator(`label:has-text("${fieldLabel}")`).first();
  const forAttr = await labelElement.getAttribute("for").catch(() => null);

  if (forAttr) {
    // Check for display value span (common for reference fields)
    const displayEl = page.locator(`#${forAttr}_label, #sys_display\\.${forAttr}`).first();
    if (await displayEl.isVisible().catch(() => false)) {
      return (await displayEl.textContent()) ?? "";
    }

    const input = page.locator(`#${forAttr}`);
    const tagName = await input.evaluate((el) => el.tagName.toLowerCase());

    if (tagName === "select") {
      return await input.locator("option:checked").textContent() ?? "";
    }
    return (await input.inputValue()) ?? "";
  }

  throw new Error(`Could not read field "${fieldLabel}"`);
}

export async function assertFieldVisible(
  page: Page,
  fieldLabel: string
): Promise<void> {
  const label = page.locator(`label:has-text("${fieldLabel}")`).first();
  await expect(label).toBeVisible();
}

export async function assertFieldNotEditable(
  page: Page,
  fieldLabel: string
): Promise<void> {
  const labelElement = page.locator(`label:has-text("${fieldLabel}")`).first();
  const forAttr = await labelElement.getAttribute("for").catch(() => null);
  if (forAttr) {
    const input = page.locator(`#${forAttr}`);
    const isReadonly = await input.getAttribute("readonly");
    const isDisabled = await input.getAttribute("disabled");
    expect(isReadonly !== null || isDisabled !== null).toBeTruthy();
  }
}

export async function submitForm(page: Page): Promise<void> {
  const submitBtn = page.locator("#sysverb_insert, #sysverb_update").first();
  await submitBtn.click();
  await page.waitForLoadState("networkidle");
}

export async function getRecordSysId(page: Page): Promise<string> {
  const url = page.url();
  const match = url.match(/sys_id=([a-f0-9]{32})/);
  if (match) return match[1];

  const sysIdField = page.locator("input[name='sys_uniqueValue']").first();
  return (await sysIdField.inputValue()) ?? "";
}
