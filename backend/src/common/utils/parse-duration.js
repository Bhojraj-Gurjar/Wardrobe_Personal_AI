const MULTIPLIERS = { s: 1, m: 60, h: 3600, d: 86400 };

export function parseDurationToSeconds(duration, fallbackSeconds = 2592000) {
  const match = String(duration).match(/^(\d+)([smhd])$/);
  if (!match) {
    return fallbackSeconds;
  }

  const value = parseInt(match[1], 10);
  return value * MULTIPLIERS[match[2]];
}
