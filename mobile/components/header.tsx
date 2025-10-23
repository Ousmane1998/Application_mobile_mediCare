import React, { useEffect, useState} from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getProfile } from '../utils/api';
import Snackbar from './Snackbar';  
import { type UserProfile } from '../utils/api';

export default function Header() {
    const router = useRouter();
    // const [notifications, setNotifications] = useState([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const [snack, setSnack] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({ visible: false, message: '', type: 'info' });
    
    useEffect(() => {
        (async () => {
            try {
                const data = await getProfile();
                const u = data.user as UserProfile;
                setProfile(u);
            } catch (e: any) {
                setSnack({ visible: true, message: e?.message || 'Erreur de chargement', type: 'error' });
            } finally {
                setSnack({ visible: true, message: 'Profil chargé avec succès', type: 'success' });
            }
        })();
    }, []);
    
    return (
        <View style={styles.topBar}>
            <Image source={require('../../assets/images/logo MediCare.png')} style={{width: 75, height: 75}} />
            <TouchableOpacity onPress={() => {router.push(profile?.role === 'medecin' ? '/Doctor/notifications' : '/Patient/notifications')}}>
                <Ionicons name="notifications-outline" style={{color: 'black', marginLeft:'auto'}} size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
                const role = profile?.role;
                if (role === 'medecin') return router.push({ pathname: '/Doctor' } as any);
                if (role === 'patient') return router.push({ pathname: '/Patient' } as any);
                if (role === 'admin') return router.push({ pathname: '/Admin' } as any);
                return router.push({ pathname: '/User' } as any);
            }}>
                <Ionicons name="person-circle-outline" style={{color: 'black'}} size={24} />
            </TouchableOpacity>
            <Snackbar visible={snack.visible} message={snack.message} type={snack.type} onHide={() => setSnack((s) => ({ ...s, visible: false }))} />
        </View>
    );
}

const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
});