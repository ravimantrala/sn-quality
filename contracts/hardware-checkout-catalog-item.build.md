---
name: hardware-checkout-catalog-item
plan: Hardware Checkout Catalog Item
table: sc_cat_item
---

# Build Spec: Hardware Checkout Catalog Item

## Artifacts to Create

### 1. Catalog Item: Hardware Checkout
- **Skill:** `sn-service-catalog`
- **Table:** sc_cat_item
- **Type:** catalog_item
- **Behavior:** Employee-facing catalog item for requesting hardware devices
- **Fields:**
  | Field | Value |
  |-------|-------|
  | name | Hardware Checkout |
  | shortDescription | Request a hardware device for work |
  | catalogs | e0d08b13c3330100c8b837659bba8fb4 (Service Catalog) |
  | categories | d258b953c611227a0146101fb1be7c31 (Hardware) |
  | availability | both |
  | requestMethod | order |
  | fulfillmentAutomationLevel | fullyAutomated |

### 2. Variable: device_type (Select Box)
- **Skill:** `sn-service-catalog`
- **Table:** item_option_new
- **Type:** catalog_variable
- **Behavior:** Dropdown for selecting device type with 4 choices
- **Fields:**
  | Field | Value |
  |-------|-------|
  | question | Device Type |
  | name | device_type |
  | type | SelectBoxVariable |
  | mandatory | true |
  | order | 100 |
- **Choices:**
  | value | label | sequence |
  |-------|-------|----------|
  | mac_laptop | Mac Laptop | 1 |
  | windows_laptop | Windows Laptop | 2 |
  | iphone | iPhone | 3 |
  | android_phone | Android Phone | 4 |

### 3. Variable: justification (Multi-Line Text)
- **Skill:** `sn-service-catalog`
- **Table:** item_option_new
- **Type:** catalog_variable
- **Behavior:** Text area for business justification
- **Fields:**
  | Field | Value |
  |-------|-------|
  | question | Business Justification |
  | name | justification |
  | type | MultiLineTextVariable |
  | mandatory | true |
  | order | 200 |

## Dependencies

- Catalog Item must be created before variables (variables reference the item)
- Choices are defined inline with the SelectBoxVariable

## Acceptance Criteria

| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| Catalog Item | Item exists and is active | Hardware Checkout catalog item is available (scenario 1) |
| Variable: device_type | Select box with 4 choices | Catalog item has variable "device_type" of type "Select Box" (scenario 1) |
| Variable: justification | Multi-line text, mandatory | Implicit — required for submission (scenario 2) |
| All artifacts | End-to-end order flow | Device request is auto-approved (scenario 2) |

## Rollback

- Catalog Item "Hardware Checkout": delete (new record, cascades to variables)
