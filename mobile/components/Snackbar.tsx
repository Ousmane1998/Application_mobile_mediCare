import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type Props = {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide?: () => void;
  durationMs?: number;
};

export default function Snackbar({ visible, message, type = 'info', onHide, durationMs = 2500 }: Props) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
        const t = setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onHide?.());
        }, durationMs);
        return () => clearTimeout(t);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const bg = type === 'success' ? '#065F46' : type === 'error' ? '#7F1D1D' : '#111827';

  return (
    <Animated.View style={[styles.wrap, { opacity }]}>      
      <View style={[styles.snackbar, { backgroundColor: bg }]}>        
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  snackbar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: '90%',
  },
  text: { color: '#fff' },
});
