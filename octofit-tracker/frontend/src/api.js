const getCodespaceName = () => process.env.REACT_APP_CODESPACE_NAME;
const getExplicitApiBaseUrl = () => process.env.REACT_APP_API_BASE_URL;

const fromBrowserLocation = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const { protocol, hostname } = window.location;

  if (hostname.includes('-3000.app.github.dev')) {
    return `${protocol}//${hostname.replace('-3000.app.github.dev', '-8000.app.github.dev')}/api`;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:8000/api`;
  }

  return null;
};

export const getApiBaseUrl = () => {
  const explicitApiBaseUrl = getExplicitApiBaseUrl();
  if (explicitApiBaseUrl) {
    return explicitApiBaseUrl.replace(/\/$/, '');
  }

  // In CRA dev mode use the frontend dev-server proxy to avoid CORS/public-port auth redirects.
  if (typeof window !== 'undefined') {
    return '/api';
  }

  const browserResolvedUrl = fromBrowserLocation();
  if (browserResolvedUrl) {
    return browserResolvedUrl;
  }

  const codespaceName = getCodespaceName();
  return codespaceName
    ? `https://${codespaceName}-8000.app.github.dev/api`
    : 'http://localhost:8000/api';
};

export const getAuthToken = () => localStorage.getItem('octofit_token');

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('octofit_token', token);
    return;
  }
  localStorage.removeItem('octofit_token');
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('octofit_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('octofit_user', JSON.stringify(user));
    return;
  }
  localStorage.removeItem('octofit_user');
};

export const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Token ${token}` } : {};
};

export const fetchWithAuth = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...authHeaders(),
    },
  });

  // Auto-clear invalid/expired token and reload to show login screen.
  if (response.status === 401) {
    const token = getAuthToken();
    if (token) {
      setAuthToken(null);
      setCurrentUser(null);
      window.location.reload();
    }
  }

  return response;
};

export const requestJson = async (url, options = {}) => {
  let response;
  try {
    response = await fetchWithAuth(url, options);
  } catch (error) {
    throw new Error('Network error: unable to reach backend API.');
  }

  const contentType = response.headers.get('content-type') || '';
  let payload = null;
  if (contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    const text = await response.text();
    payload = text ? { detail: text } : {};
  }

  if (!response.ok) {
    const detail = payload?.detail || `Request failed with status ${response.status}.`;
    throw new Error(detail);
  }

  return payload;
};