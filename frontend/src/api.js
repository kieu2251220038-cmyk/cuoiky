const API_BASE_URL =
  window.__APP_CONFIG__?.API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000/api';

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function request(path, options = {}) {
  const token =
    localStorage.getItem('moneytracker_access_token');

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
        ...(options.headers || {}),
      },

      ...options,
    }
  );

  if (!response.ok) {
    let errorMessage = 'API request failed';

    try {
      const errorData = await response.json();

      errorMessage =
        errorData.detail ||
        errorData.message ||
        JSON.stringify(errorData);
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
