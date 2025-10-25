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
  console.log("🌍 URL finale utilisée :", `${API_URL}${path}`);
  console.log("🪪 Token envoyé :", token);
  console.log("📦 Corps de la requête :", options.body);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => undefined);

  if (!res.ok) {
    const error: any = new Error(data?.message || 'Erreur API');
    error.debug = data?.debug || null;
    console.log("📥 Erreur backend complète :", data);
    throw error;
  }

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
  photo?: string;
};

// Profile
export async function getProfile(): Promise<{ user: UserProfile }>{
  return authFetch('/auth/profile');
}

// Modify Profile
export async function updateProfile(payload: Partial<UserProfile>) {
  return authFetch('/auth/modifyProfile', { method: 'POST', body: JSON.stringify(payload) });
}

// Change Password
export async function changePassword(oldPassword: string, password: string) {
  return authFetch('/auth/changePassword', { method: 'POST', body: JSON.stringify({ oldPassword, password }) });
}

// Forgot Password
export async function requestPasswordReset(identifier: string) {
  return authFetch('/auth/forgotPassword', { method: 'POST', body: JSON.stringify({ identifier }) });
}

// Reset Password
export async function resetPasswordWithCode(identifier: string, code: string, newPassword: string) {
  return authFetch('/auth/resetPassword', { method: 'POST', body: JSON.stringify({ identifier, code, newPassword }) });
}

// Update Photo
export async function updatePhoto(photoBase64OrDataUrl: string) {
  return authFetch('/auth/updatePhoto', { method: 'POST', body: JSON.stringify({ photo: photoBase64OrDataUrl }) });
}

// Measures
export type MeasureType = 'tension' | 'glycemie' | 'poids' | 'pouls' | 'temperature';
export async function addMeasure(payload: { patientId: string; type: MeasureType; value: string; heure?: string; synced?: boolean; notes?: string }) {
  return authFetch('/measures', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getMeasuresHistory(patientId: string) {
  return authFetch(`/measures/history/${encodeURIComponent(patientId)}`);
}

// Appointments
export async function createAppointment(payload: { patientId: string; medecinId: string; date: string; heure?: string; statut?: 'en_attente' | 'confirme' | 'annule';typeConsultation?: string;  }) {
  return authFetch('/appointments', { method: 'POST', body: JSON.stringify(payload) });
}

export type AppointmentItem = {
  _id: string;
  patientId: any;
  medecinId: any;
  date: string;
  heure?: string;
  statut: 'en_attente' | 'confirme' | 'annule' | string;
  typeConsultation?: string;
};

export async function getAppointments(): Promise<AppointmentItem[]> {
  return authFetch('/appointments');
}

export async function updateAppointment(id: string, payload: Partial<{ statut: 'en_attente'|'confirme'|'annule'; date: string; heure: string }>) {
  return authFetch(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

// Messages
export async function sendMessage(payload: { senderId: string; receiverId: string; text: string }) {
  return authFetch('/messages', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getMessages(params?: Record<string, string>) {
  const qs = params ? ('?' + new URLSearchParams(params).toString()) : '';
  return authFetch(`/messages${qs}`);
}
//list medecins
export async function getMedecins() {
  return authFetch('/users/medecins');
}
// utils/api.tsx (ou où est ta fonction)
export async function getAvailabilityByMedecin(medecinId: string) {
  return authFetch(`/availability?medecinId=${medecinId}`);
}

export async function setAvailability(payload: { medecinId: string; jour: string; heureDebut: string; heureFin: string; disponible?: boolean }) {
  return authFetch('/availability', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateAvailability(id: string, payload: Partial<{ jour: string; heureDebut: string; heureFin: string; disponible: boolean }>) {
  return authFetch(`/availability/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function deleteAvailabilityApi(id: string) {
  return authFetch(`/availability/${id}`, { method: 'DELETE' });
}




// Create Patients 
export async function createPatient(payload: {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  age?: string;
  adresse?: string;
  pathologie?: string;
   idMedecin?: string;
}) {
  return authFetch('/auth/registerPatient', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      telephone: Number(payload.telephone), // ✅ Convertir en nombre
    }),
  });
}

// Notifications
export type NotificationItem = {
  _id: string;
  id?: string;
  userId: string;
  type?: 'message' | 'rdv' | 'alerte' | string;
  message?: string;
  isRead?: boolean;
  data?: any;
  createdAt?: string;
};

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  return authFetch(`/notifications?userId=${encodeURIComponent(userId)}`);
}

export async function markNotificationRead(id: string) {
  return authFetch(`/notifications/${id}/read`, { method: 'PUT' });
}

export async function deleteNotification(id: string) {
  return authFetch(`/notifications/${id}`, { method: 'DELETE' });
}

// Admin
export type AppUser = {
  _id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string | number;
  role: 'patient' | 'medecin' | 'admin' | string;
  archived?: boolean;
};

export type AdminStats = { total: number; patients: number; medecins: number; admins: number };

export async function adminListUsers(): Promise<AppUser[]> {
  return authFetch('/users');
}

export async function adminGetStats(): Promise<AdminStats> {
  return authFetch('/users/stats');
}

export async function adminUpdateUserRole(id: string, role: 'patient' | 'medecin' | 'admin') {
  return authFetch(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
}

export async function adminArchiveUser(id: string) {
  return authFetch(`/users/archive/${id}`, { method: 'PUT' });
}

export async function adminDeleteUser(id: string) {
  return authFetch(`/users/${id}`, { method: 'DELETE' });
}

