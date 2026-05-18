const API_HOST = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://192.168.254.12:4000';
const MINIO_HOST = API_HOST.replace(':4000', ':9000');

/** Rewrites localhost MinIO URLs → machine IP so phones can load them */
export function fixMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace('http://localhost:9000', MINIO_HOST);
}

export function getLevelName(level: number): string {
  const names = ['Newcomer', 'Beginner', 'Learner', 'Intermediate', 'Advanced', 'Expert', 'Master', 'Champion', 'Legend', 'Grandmaster'];
  return names[Math.min(level - 1, names.length - 1)] ?? 'Grandmaster';
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  return `NPR ${price.toLocaleString()}`;
}
