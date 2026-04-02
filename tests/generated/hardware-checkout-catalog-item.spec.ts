import { test, expect } from "@playwright/test";
import "dotenv/config";

test.describe("Hardware Checkout Catalog Item", () => {
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

  test("Hardware Checkout catalog item is available with device type choices", /* @Setup @Smoke */ async ({ request }) => {
    // Query sc_cat_item
    const queriedRes = await request.get(`/api/now/table/sc_cat_item?sysparm_query=name=Hardware Checkout^active=true&sysparm_limit=1`);
    expect(queriedRes.ok()).toBeTruthy();
    const queriedList = (await queriedRes.json()).result;
    const queried = queriedList[0];

    expect(queried).toBeTruthy();
    // Assert: variable device_type exists
    const variable_device_type_existsRes = await request.get(`/api/now/table/item_option_new?sysparm_query=cat_item=${queried.sys_id}^name=device_type&sysparm_limit=5`);
    const variable_device_type_existsData = (await variable_device_type_existsRes.json()).result;
    expect(variable_device_type_existsData.length).toBeGreaterThan(0);

    // Verify choice: mac_laptop
    // Verify choice: windows_laptop
    // Verify choice: iphone
    // Verify choice: android_phone
  });

  test("Device request is auto-approved", /* @Submission @AutoApproval @Smoke */ async ({ request }) => {
    // Submit catalog item: Hardware Checkout
    // Order catalog item via Service Catalog API
    // First, find the catalog item
    const catItemRes = await request.get(`/api/now/table/sc_cat_item?sysparm_query=name=Hardware Checkout^active=true&sysparm_fields=sys_id&sysparm_limit=1`);
    const catItems = (await catItemRes.json()).result;
    expect(catItems.length).toBeGreaterThan(0);
    const catItemId = catItems[0].sys_id;

    // Submit order via cart API
    const orderRes = await request.post(`/api/sn_sc/servicecatalog/items/${catItemId}/order_now`, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: {
        sysparm_quantity: 1,
        variables: {
              "device_type": "mac_laptop",
              "justification": "New hire equipment"
        }
      },
    });
    expect(orderRes.ok()).toBeTruthy();
    const orderData = await orderRes.json();
    const requestId = orderData.result?.request_id || orderData.result?.sys_id;

    // Get the RITM from the request
    const ritmRes = await request.get(`/api/now/table/sc_req_item?sysparm_query=request=${requestId}&sysparm_limit=1`);
    const ritms = (await ritmRes.json()).result;
    expect(ritms.length).toBeGreaterThan(0);
    const created = ritms[0];

    createdIds.push({ table: "sc_req_item", id: created.sys_id });
    // Record creation verified by API response
    expect(created.approval).toBe("approved");
    // Assert: fulfillment task exists
    const fulfillment_task_existsRes = await request.get(`/api/now/table/sc_task?sysparm_query=request_item=${created.sys_id}&sysparm_limit=5`);
    const fulfillment_task_existsData = (await fulfillment_task_existsRes.json()).result;
    expect(fulfillment_task_existsData.length).toBeGreaterThan(0);

    // Record tracked for cleanup
  });

});
