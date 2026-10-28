const API_URL = import.meta.env.VITE_API_URL || '/api';

const headers = () => {
  const token = localStorage.getItem('sp_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const api = {
  get: (path) => fetch(`${API_URL}${path}`, { headers: headers() }).then(handle),

  post: (path, body) =>
    fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    }).then(handle),

  put: (path, body) =>
    fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
    }).then(handle),

  delete: (path, body) =>
    fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: headers(),
      ...(body && { body: JSON.stringify(body) }),
    }).then(handle),

  upload: (path, formData) => {
    const token = localStorage.getItem('sp_token');
    return fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    }).then(handle);
  },
};
