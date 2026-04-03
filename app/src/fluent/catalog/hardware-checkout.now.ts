import '@servicenow/sdk/global'
import { CatalogItem, SelectBoxVariable, MultiLineTextVariable } from '@servicenow/sdk/core'

const serviceCatalog = 'e0d08b13c3330100c8b837659bba8fb4'
const hardwareCategory = 'd258b953c611227a0146101fb1be7c31'

export const hardwareCheckout = CatalogItem({
  $id: Now.ID['hardware-checkout'],
  name: 'Hardware Checkout',
  shortDescription: 'Request a hardware device for work',
  description: 'Submit a request for a hardware device. Choose your device type and provide a business justification.',

  catalogs: [serviceCatalog],
  categories: [hardwareCategory],

  availability: 'both',
  requestMethod: 'order',
  executionPlan: '523da512c611228900811a37c97c2014',

  variables: {
    device_type: SelectBoxVariable({
      question: 'Device Type',
      mandatory: true,
      order: 100,
      choices: {
        mac_laptop: { label: 'Mac Laptop', sequence: 1 },
        windows_laptop: { label: 'Windows Laptop', sequence: 2 },
        iphone: { label: 'iPhone', sequence: 3 },
        android_phone: { label: 'Android Phone', sequence: 4 },
      },
    }),
    justification: MultiLineTextVariable({
      question: 'Business Justification',
      mandatory: true,
      order: 200,
    }),
  },
})
