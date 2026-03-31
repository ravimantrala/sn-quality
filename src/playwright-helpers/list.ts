import { Page, expect } from "@playwright/test";

export async function navigateToList(
  page: Page,
  table: string,
  query?: string
): Promise<void> {
  const instance = process.env.SN_INSTANCE!;
  let url = `${instance}/${table}_list.do`;
  if (query) url += `?sysparm_query=${encodeURIComponent(query)}`;
  await page.goto(url);
  await page.waitForLoadState("networkidle");
}

export async function getListRowCount(page: Page): Promise<number> {
  const rows = page.locator("tr.list_row, tr.list_odd, tr.list_even");
  return await rows.count();
}

export async function assertAllRowsMatch(
  page: Page,
  columnLabel: string,
  expectedValue: string
): Promise<void> {
  const headers = page.locator("th.column_head .column_header");
  const count = await headers.count();
  let colIndex = -1;

  for (let i = 0; i < count; i++) {
    const text = await headers.nth(i).textContent();
    if (text?.trim() === columnLabel) {
      colIndex = i;
      break;
    }
  }

  if (colIndex === -1) {
    throw new Error(`Column "${columnLabel}" not found in list view`);
  }

  const rows = page.locator("tr.list_row, tr.list_odd, tr.list_even");
  const rowCount = await rows.count();

  for (let i = 0; i < rowCount; i++) {
    const cell = rows.nth(i).locator("td").nth(colIndex);
    const text = (await cell.textContent())?.trim() ?? "";
    expect(text).toBe(expectedValue);
  }
}
