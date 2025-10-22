import AsyncStorage from '@react-native-async-storage/async-storage';

function withApiSuffix(url: string) {
  try {
    const u = new URL(url);
    if (!u.pathname.endsWith('/api')) {
      u.pathname = u.pathname.replace(/\/?$/, '/api');
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    // Fallback simple join
    return url.endsWith('/api') ? url : `${url.replace(/\/$/, '')}/api`;
  }
}

export const API_URL = withApiSuffix(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000');

export async function authFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('authToken');
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => undefined);
  if (!res.ok) throw new Error((data && (data.message || data.error)) || 'Erreur API');
  return data;
}

export type UserProfile = {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  age?: number;
  role: 'patient' | 'medecin' | 'admin' | string;
  specialite?: string;
  hopital?: string;
};

export async function getProfile(): Promise<{ user: UserProfile }>{
  return authFetch('/auth/profile');
}

export async function updateProfile(payload: Partial<UserProfile>) {
  return authFetch('/auth/modifyProfile', { method: 'POST', body: JSON.stringify(payload) });
}

export async function changePassword(password: string) {
  return authFetch('/auth/changePassword', { method: 'POST', body: JSON.stringify({ password }) });
}
