export function resolveAnalyticsPeriodRange(periodId = 'month') {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (periodId) {
    case 'today':
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(start.getDate() - 6);
      break;
    case 'month':
      start.setDate(start.getDate() - 29);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 2);
      start.setDate(1);
      break;
    case 'year':
      start.setMonth(0, 1);
      break;
    default:
      start.setDate(start.getDate() - 29);
      break;
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}
