---
name: hardware-checkout-device-types
plan: Hardware Checkout Catalog Item
table: sc_cat_item
---

# Build Spec: Hardware Checkout Device Type Validation

## Artifacts to Create

No additional artifacts — this contract validates the same catalog item and variables from `hardware-checkout-catalog-item.build.md` across all 4 device types.

## Dependencies

- Depends on all artifacts from `hardware-checkout-catalog-item.build.md`

## Acceptance Criteria

| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| Catalog Item + Variables | Each device type creates auto-approved RITM | 4 Scenario Outline examples (mac_laptop, windows_laptop, iphone, android_phone) |

## Rollback

- No additional rollback — handled by `hardware-checkout-catalog-item.build.md`
