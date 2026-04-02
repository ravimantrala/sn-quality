import '@servicenow/sdk/global'
import { BusinessRule } from '@servicenow/sdk/core'
import { calculatePriority } from '../../server/calculate-priority.js'

BusinessRule({
  $id: Now.ID['auto-priority-from-impact-urgency'],
  name: 'Auto Priority from Impact Urgency',
  table: 'incident',
  when: 'before',
  action: ['insert', 'update'],
  order: 50,
  active: true,
  filterCondition: 'impactCHANGES^ORurgencyCHANGES',
  script: calculatePriority,
  description: 'Calculates priority from 3x3 impact/urgency matrix',
})
