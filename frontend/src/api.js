function resolveApiBaseUrl() {
  const baseUrl =
    window.__APP_CONFIG__?.API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('Missing API base URL configuration');
  }

  return baseUrl;
}

export function getApiBaseUrl() {
  return resolveApiBaseUrl();
}

export async function request(path, options = {}) {
  const apiBaseUrl = resolveApiBaseUrl();
  const token =
    localStorage.getItem('moneytracker_access_token');

  const response = await fetch(
    `${apiBaseUrl}${path}`,
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
    } catch (parseError) {
      void parseError;
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}