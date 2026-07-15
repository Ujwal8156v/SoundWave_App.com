import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';

export default function TabButton({ label, icon, active, onPress }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Ionicons name={icon} size={22} color={active ? colors.primary : colors.muted} />
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    minHeight: 56,
    justifyContent: 'center'
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700'
  },
  activeLabel: {
    color: colors.primary
  }
});