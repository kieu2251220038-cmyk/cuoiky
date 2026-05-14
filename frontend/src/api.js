export function getApiBaseUrl() {
  const runtimeBaseUrl = globalThis.window?.__APP_CONFIG__?.API_BASE_URL;
  const buildBaseUrl = import.meta.env.VITE_API_BASE_URL;
  return runtimeBaseUrl || buildBaseUrl || '';
}

export async function request(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('Missing API base URL. Set window.__APP_CONFIG__.API_BASE_URL or VITE_API_BASE_URL.');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = globalThis.localStorage?.getItem('moneytracker_access_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    globalThis.localStorage?.removeItem('moneytracker_access_token');
    throw new Error('Phien dang nhap het han. Vui long dang nhap lai.');
  }

  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.detail) {
        detail = data.detail;
      } else if (data && typeof data === 'object') {
        const parts = [];
        for (const [key, val] of Object.entries(data)) {
          if (Array.isArray(val)) {
            parts.push(`${key}: ${val.join(', ')}`);
          } else if (val && typeof val === 'object') {
            parts.push(`${key}: ${JSON.stringify(val)}`);
          } else {
            parts.push(`${key}: ${String(val)}`);
          }
        }
        if (parts.length) {
          detail = parts.join('; ');
        }
      }
    } catch {
      // Ignore non-JSON payloads.
    }

    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
