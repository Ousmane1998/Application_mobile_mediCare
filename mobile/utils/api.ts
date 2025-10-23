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
  _id: string;
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

export async function changePassword(oldPassword: string, password: string) {
  return authFetch('/auth/changePassword', { method: 'POST', body: JSON.stringify({ oldPassword, password }) });
}

// Password reset
export async function requestPasswordReset(identifier: string) {
  return authFetch('/auth/forgotPassword', { method: 'POST', body: JSON.stringify({ identifier }) });
}

export async function resetPasswordWithCode(identifier: string, code: string, newPassword: string) {
  return authFetch('/auth/resetPassword', { method: 'POST', body: JSON.stringify({ identifier, code, newPassword }) });
}

// Measures
export type MeasureType = 'tension' | 'glycemie' | 'poids' | 'pouls' | 'temperature';
export async function addMeasure(payload: { patientId: string; type: MeasureType; value: string; heure?: string; synced?: boolean; notes?: string }) {
  return authFetch('/measures', { method: 'POST', body: JSON.stringify(payload) });
}

// Appointments
export async function createAppointment(payload: { patientId: string; medecinId: string; date: string; heure?: string; statut?: 'en_attente' | 'confirme' | 'annule';typeConsultation?: string;  }) {
  return authFetch('/appointments', { method: 'POST', body: JSON.stringify(payload) });
}

// Messages
export async function sendMessage(payload: { senderId: string; receiverId: string; text: string }) {
  return authFetch('/messages', { method: 'POST', body: JSON.stringify(payload) });
}
