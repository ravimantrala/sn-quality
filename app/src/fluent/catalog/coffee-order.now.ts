import '@servicenow/sdk/global'
import { CatalogItem, SelectBoxVariable } from '@servicenow/sdk/core'

const serviceCatalog = 'e0d08b13c3330100c8b837659bba8fb4'
const officeCategory = '109cdff8c6112276003b17991a09ad65'

export const coffeeOrder = CatalogItem({
  $id: Now.ID['coffee-order'],
  name: 'Coffee Order',
  shortDescription: 'Order coffee from the office Starbucks',
  description: 'Choose your coffee type and pickup or delivery. Black coffee is free (limit 1 per day). Latte $5, Cappuccino $7.',

  catalogs: [serviceCatalog],
  categories: [officeCategory],

  availability: 'both',
  requestMethod: 'order',
  executionPlan: '523da512c611228900811a37c97c2014',

  variables: {
    coffee_type: SelectBoxVariable({
      question: 'Coffee Type',
      mandatory: true,
      order: 100,
      choices: {
        latte: { label: 'Latte', sequence: 1 },
        black: { label: 'Black', sequence: 2 },
        cappuccino: { label: 'Cappuccino', sequence: 3 },
      },
    }),
    delivery_method: SelectBoxVariable({
      question: 'Delivery Method',
      mandatory: true,
      order: 200,
      choices: {
        pickup: { label: 'Pickup', sequence: 1 },
        delivery: { label: 'Delivery', sequence: 2 },
      },
    }),
  },
})
