// Simple secure storage wrapper with integrity checksum to prevent tampering in localStorage

const STORAGE_SECRET = 'athleteos_secure_salt_2026_x7k9';

// Simple lightweight hash / checksum function for integrity
function generateChecksum(data: string): string {
  let hash = 0;
  const combined = data + STORAGE_SECRET;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function setSecureItem(key: string, value: any): void {
  try {
    const rawData = JSON.stringify(value);
    const checksum = generateChecksum(rawData);
    const payload = {
      d: btoa(encodeURIComponent(rawData)),
      c: checksum,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.error('Error saving secure item', e);
  }
}

export function getSecureItem<T>(key: string): T | null {
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const payload = JSON.parse(itemStr);
    if (!payload || !payload.d || !payload.c) return null;

    const rawData = decodeURIComponent(atob(payload.d));
    const expectedChecksum = generateChecksum(rawData);

    if (payload.c !== expectedChecksum) {
      console.warn('Tampering detected in secure storage for key:', key);
      localStorage.removeItem(key);
      return null;
    }

    return JSON.parse(rawData) as T;
  } catch (e) {
    console.error('Error reading secure item', e);
    localStorage.removeItem(key);
    return null;
  }
}

export function removeSecureItem(key: string): void {
  localStorage.removeItem(key);
}
