export function calculatePriority(current: any) {
  const matrix: Record<string, number> = {
    '1_1': 1,
    '1_2': 2,
    '1_3': 3,
    '2_1': 2,
    '2_2': 3,
    '2_3': 4,
    '3_1': 3,
    '3_2': 4,
    '3_3': 5,
  };
  const key = current.getValue('impact') + '_' + current.getValue('urgency');
  current.setValue('priority', matrix[key] || 5);
}
