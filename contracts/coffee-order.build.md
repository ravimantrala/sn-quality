---
name: coffee-order
plan: Office Coffee Order
table: sc_cat_item
---

# Build Spec: Office Coffee Order

## Artifacts to Create

### 1. Catalog Item: Coffee Order
- **Skill:** `sn-service-catalog`
- **Table:** sc_cat_item
- **Type:** catalog_item
- **Behavior:** Employee-facing catalog item for ordering coffee from the office Starbucks
- **Fields:**
  | Field | Value |
  |-------|-------|
  | name | Coffee Order |
  | shortDescription | Order coffee from the office Starbucks |
  | description | Choose your coffee type and pickup or delivery. Black coffee is free (limit 1 per day). Latte $5, Cappuccino $7. |
  | catalogs | e0d08b13c3330100c8b837659bba8fb4 (Service Catalog) |
  | categories | 109cdff8c6112276003b17991a09ad65 (Office) |
  | availability | both |
  | requestMethod | order |
  | fulfillmentAutomationLevel | fullyAutomated |

### 2. Variable: coffee_type (Select Box)
- **Skill:** `sn-service-catalog`
- **Table:** item_option_new
- **Type:** catalog_variable
- **Behavior:** Dropdown for selecting coffee type with pricing
- **Fields:**
  | Field | Value |
  |-------|-------|
  | question | Coffee Type |
  | name | coffee_type |
  | type | SelectBoxVariable |
  | mandatory | true |
  | order | 100 |
- **Choices:**
  | value | label | sequence |
  |-------|-------|----------|
  | latte | Latte | 1 |
  | black | Black | 2 |
  | cappuccino | Cappuccino | 3 |

### 3. Variable: delivery_method (Select Box)
- **Skill:** `sn-service-catalog`
- **Table:** item_option_new
- **Type:** catalog_variable
- **Behavior:** Pickup or delivery selection
- **Fields:**
  | Field | Value |
  |-------|-------|
  | question | Delivery Method |
  | name | delivery_method |
  | type | SelectBoxVariable |
  | mandatory | true |
  | order | 200 |
- **Choices:**
  | value | label | sequence |
  |-------|-------|----------|
  | pickup | Pickup | 1 |
  | delivery | Delivery | 2 |

## Dependencies

- Catalog Item must be created before variables
- Choices are defined inline with SelectBoxVariable

## Acceptance Criteria

| Artifact | Validates | Contract Scenario |
|----------|-----------|-------------------|
| Catalog Item | Item exists and is active | Scenario 1: catalog item available |
| Variable: coffee_type | Select box with 3 choices | Scenario 1: coffee_type choices |
| Variable: delivery_method | Select box with 2 choices | Scenario 1: delivery_method exists |
| All artifacts | Latte + delivery order flow | Scenario 2: latte delivery |
| All artifacts | Black + pickup order flow | Scenario 3: black coffee pickup |
| All artifacts | Cappuccino + pickup order flow | Scenario 4: cappuccino pickup |

## Rollback

- Catalog Item "Coffee Order": delete (new record, cascades to variables)
