import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header() {
    return (
        <View style={styles.topBar}>
            {/* <Image source={require('../../assets/images/logo MediCare.png')} style={{width: 50, height: 50}} /> */}
            <Ionicons name="notifications-outline" style={{color: 'black', marginLeft:'auto'}} size={24} />
            <Ionicons name="person-circle-outline" style={{color: 'black'}} size={24} />
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