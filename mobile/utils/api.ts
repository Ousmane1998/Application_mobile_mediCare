// @ts-nocheck
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


// Fiche de santé: créer une fiche vide si elle n'existe pas
export async function ensureHealthRecordExists(patientId: string): Promise<any> {
  try {
    const fiches = await authFetch('/fiches');
    const existing = (Array.isArray(fiches) ? fiches : []).find((f: any) => String((f.patient?._id)||f.patient) === String(patientId));
    if (existing) return existing;
    
    // Créer une fiche vide
    console.log('📝 Création d\'une fiche vide pour:', patientId);
    const newFiche = await authFetch('/fiches', {
      method: 'POST',
      body: JSON.stringify({ patient: patientId })
    });
    return newFiche;
  } catch (e: any) {
    console.warn('⚠️ Erreur création fiche:', e?.message);
    return null;
  }
}

// Fiche de santé: génération de token de partage (valide 1 jour côté serveur)
export async function createFicheShareToken(patientId?: string): Promise<{ token: string; expiresIn: number }> {
  const payload = patientId ? { patientId } : ({} as any);
  return authFetch('/fiches/share-token', { method: 'POST', body: JSON.stringify(payload) });
}

export const API_URL = withApiSuffix(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000');
export const SOCKET_URL = API_URL.replace(/\/api$/, '');
export const ORG_NAME = process.env.EXPO_PUBLIC_ORG_NAME || 'MediCare';
export const ORG_LOGO = process.env.EXPO_PUBLIC_ORG_LOGO || '../assets/logoMediCare.png';
export const SECURE_FICHE_BASE = process.env.EXPO_PUBLIC_SECURE_FICHE_BASE_URL || '';



export async function authFetch(path: string, options: RequestInit = {}) {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    console.log(" URL finale utilisée :", `${API_URL}${path}`);
    console.log(" Token envoyé :", token);
    console.log(" Corps de la requête :", options.body);

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    console.log(" Statut réponse :", res.status, res.statusText);
    
    const data = await res.json().catch(() => undefined);
    console.log(" Données reçues :", data);

    if (!res.ok) {
      const errorMessage = data?.message || data?.error || `Erreur HTTP ${res.status}`;
      const error: any = new Error(errorMessage);
      error.debug = data?.debug || null;
      error.status = res.status;
      console.log("❌ Erreur backend complète :", data);
      throw error;
    }

    return data;
  } catch (err: any) {
    console.error("❌ Erreur authFetch :", err.message);
    throw err;
  }
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
  medecinId?: string;
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

// Register Doctor (without authentication)
export async function authRegisterDoctor(payload: {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  age?: number;
  adresse?: string;
  specialite?: string;
  hopital?: string;
}) {
  try {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    console.log('📝 [authRegisterDoctor] Envoi:', payload);
    
    const res = await fetch(`${API_URL}/auth/registerDoctor`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    console.log('📝 [authRegisterDoctor] Statut:', res.status);
    
    const data = await res.json().catch(() => undefined);
    console.log('📝 [authRegisterDoctor] Réponse:', data);
    
    if (!res.ok) {
      const errorMessage = data?.message || data?.error || `Erreur HTTP ${res.status}`;
      const error: any = new Error(errorMessage);
      error.status = res.status;
      throw error;
    }
    
    // Sauvegarder le token si reçu
    if (data?.token) {
      await AsyncStorage.setItem('authToken', data.token);
      console.log('✅ [authRegisterDoctor] Token sauvegardé');
    }
    
    return data;
  } catch (err: any) {
    console.error('❌ [authRegisterDoctor] Erreur:', err.message);
    throw err;
  }
}

// Measures
export type MeasureType = 'tension' | 'glycemie' | 'poids' | 'pouls' | 'temperature';
export async function addMeasure(payload: { patientId: string; type: MeasureType; value: string; heure?: string; synced?: boolean; notes?: string }) {
  return authFetch('/measures', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getMeasuresHistory(patientId: string) {
  return authFetch(`/measures/history/${encodeURIComponent(patientId)}`);
}

export async function getMeasures(patientId: string) {
  return authFetch(`/measures/${encodeURIComponent(patientId)}`);
}

// Advices
export async function getAdvices(patientId: string) {
  return authFetch(`/advices/${encodeURIComponent(patientId)}`);
}

export async function createAdvice(payload: {
  medecinId: string;
  patientId: string;
  titre: string;
  contenu: string;
  categorie: string;
}) {
  return authFetch('/advices', { method: 'POST', body: JSON.stringify(payload) });
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
export type MessageItem = {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  isRead?: boolean;
  createdAt: string;
};

export async function sendMessage(payload: { 
  senderId: string; 
  receiverId: string; 
  text?: string;
  type?: 'text' | 'voice';
  voiceUrl?: string;
  voiceDuration?: number;
  isViewOnce?: boolean;
}): Promise<MessageItem> {
  const response = await authFetch('/messages', { method: 'POST', body: JSON.stringify(payload) });
  return response.data || response;
}

export async function getMessages(user1: string, user2: string): Promise<MessageItem[]> {
  return authFetch(`/messages?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`);
}

// Marquer un message comme lu
export async function markMessageAsRead(messageId: string): Promise<any> {
  return authFetch(`/messages/${messageId}/read`, { method: 'PUT' });
}

// Définir le statut "en train d'écrire"
export async function setTypingStatus(receiverId: string, isTyping: boolean): Promise<any> {
  return authFetch('/messages/typing', { 
    method: 'POST', 
    body: JSON.stringify({ receiverId, isTyping })
  });
}

// Supprimer un message "vu unique"
export async function deleteViewOnceMessage(messageId: string): Promise<any> {
  return authFetch(`/messages/${messageId}/view-once`, { method: 'DELETE' });
}

// List medecins
export async function getMedecins() {
  return authFetch('/users/medecins');
}

// Get medecin by ID
export async function getMedecinById(medecinId: string) {
  return authFetch(`/users/${medecinId}`);
}

// Get my patients (for doctor)
export async function listMyPatients(): Promise<Patient[]> {
  return authFetch('/users/my-patients');
}

export type Patient = {
  _id: string;
  nom: string;
  prenom: string;
  email?: string;
  photo?: string;
  pathologie?: string;
  telephone?: string;
};
export async function getMeasureById(id: string) {
  return authFetch(`/measures/${id}`);
}

// Availability
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
  pathologie: string;
  idMedecin: string;
}) {
  return authFetch('/auth/registerPatient', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      telephone: Number(payload.telephone),
    }),
  });
}

// Notifications
export type NotificationItem = {
  _id: string;
  userId: string;
  type: string;
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

export async function createNotification(payload: { userId: string; type: string; message?: string; data?: any }) {
  return authFetch('/notifications', { method: 'POST', body: JSON.stringify(payload) });
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

export type AdminStats = { total: number; patients: number; medecins: number; admins: number; pendingMedecins?: number };

export async function adminListUsers(): Promise<AppUser[]> {
  return authFetch('/users');
}

export async function adminGetStats(): Promise<AdminStats> {
  return authFetch('/users/stats');
}

export async function adminUpdateUser(id: string, data: Partial<AppUser>) {
  return authFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
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

export async function adminSetUserActivation(id: string, active: boolean, status?: string) {
  const body: any = { active };
  if (typeof status === 'string') body.status = status;
  return authFetch(`/users/${id}/activation`, { method: 'PUT', body: JSON.stringify(body) });
}

// Logout
export async function logout() {
  try {
    await authFetch('/auth/logout', { method: 'POST' });
  } catch (err: any) {
    // Ignorer l'erreur 404 si l'endpoint n'existe pas
    if (err?.message?.includes('404')) {
      console.log('ℹ️ Endpoint logout non disponible, déconnexion locale');
    } else {
      console.error("Erreur logout:", err);
    }
  } finally {
    // Supprimer le token même si la requête échoue
    await AsyncStorage.removeItem('authToken');
  }
}

// Structures (via OpenStreetMap API)
export async function getNearbyStructures(latitude: number, longitude: number, radius: number = 10) {
  return fetch(`${API_URL}/structures/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`)
    .then(res => res.json());
}

// Health records (Fiche de santé)
export type HealthRecord = {
  _id: string;
  patient: any;
  maladies?: string[];
  traitements?: string[];
  allergies?: string[];
  antecedents?: string[];
  groupeSanguin?: string;
  derniereMiseAJour?: string;
};

export async function listHealthRecords(): Promise<HealthRecord[]> {
  return authFetch('/fiches');
}

export async function getMyHealthRecord(): Promise<HealthRecord | null> {
  try {
    const prof = await getProfile();
    const id = (prof.user as any)._id || (prof.user as any).id;
    console.log('🔍 Recherche fiche pour patient:', id);
    
    const fiches = await listHealthRecords();
    console.log('📋 Fiches reçues:', fiches);
    
    if (!Array.isArray(fiches)) {
      console.warn('⚠️ Fiches n\'est pas un tableau:', fiches);
      return null;
    }
    
    // Chercher la fiche du patient
    const rec = fiches.find((f: any) => {
      const fichePatientId = String((f.patient?._id) || f.patient || '');
      const userId = String(id);
      console.log(`  Comparaison: ${fichePatientId} === ${userId} ? ${fichePatientId === userId}`);
      return fichePatientId === userId;
    });
    
    if (rec) {
      console.log('✅ Fiche trouvée:', rec);
    } else {
      console.warn('⚠️ Aucune fiche trouvée pour ce patient');
    }
    
    return rec || null;
  } catch (e: any) {
    console.error('❌ Erreur getMyHealthRecord:', e?.message);
    return null;
  }
}

// Récupérer les ordonnances du patient
export async function getOrdonnances() {
  return authFetch('/ordonnances');
}

export async function updateHealthRecord(id: string, payload: Partial<HealthRecord>) {
  return authFetch(`/fiches/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) });
}
