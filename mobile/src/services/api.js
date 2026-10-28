import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEFAULT_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});

let customApiUrl = null;

export const setCustomApiUrl = (url) => {
  customApiUrl = url;
};

const getBaseUrl = async () => {
  if (customApiUrl) return customApiUrl;
  const stored = await AsyncStorage.getItem('skypulse_api_url');
  return stored || DEFAULT_URL;
};

const getHeaders = async () => {
  const token = await AsyncStorage.getItem('sp_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Network request failed');
  return data;
};

export const api = {
  get: async (path) => {
    const baseUrl = await getBaseUrl();
    const headers = await getHeaders();
    return fetch(`${baseUrl}${path}`, { headers }).then(handle);
  },

  post: async (path, body) => {
    const baseUrl = await getBaseUrl();
    const headers = await getHeaders();
    return fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }).then(handle);
  },

  put: async (path, body) => {
    const baseUrl = await getBaseUrl();
    const headers = await getHeaders();
    return fetch(`${baseUrl}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    }).then(handle);
  },

  delete: async (path, body) => {
    const baseUrl = await getBaseUrl();
    const headers = await getHeaders();
    return fetch(`${baseUrl}${path}`, {
      method: 'DELETE',
      headers,
      ...(body && { body: JSON.stringify(body) }),
    }).then(handle);
  },
};
