// Convert a cron expression to an interval
export const convertIntervalToCronScheduleValue = (
  interval: string,
): string => {
  if (!isNaN(Number(interval))) {
    return `*/${interval} * * * *`;
  }

  const unit = interval.slice(-1);
  const value = parseInt(interval.slice(0, -1), 10);

  switch (unit) {
    case 's': // seconds
      return `*/${value} * * * * *`;
    case 'm': // minutes
      return `*/${value} * * * *`;
    case 'h': // hours
      return `0 */${value} * * *`;
    case 'd': // days
      return `0 0 */${value} * *`;
    default:
      return `*/5 * * * *`; // default is every 5 minutes
  }
};

export const buildQuery = (topics: string[]): string => {
  const query = topics.map((topic) => `"${topic}"`).join(' OR ');
  return query;
};
