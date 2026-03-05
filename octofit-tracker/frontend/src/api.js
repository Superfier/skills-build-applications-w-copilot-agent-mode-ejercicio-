const getCodespaceName = () => process.env.REACT_APP_CODESPACE_NAME;

export const getApiBaseUrl = () => {
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

export const authHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Token ${token}` } : {};
};

export const fetchWithAuth = (url, options = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...authHeaders(),
    },
  });
};