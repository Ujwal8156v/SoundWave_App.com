import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

export default function AudioFxModal({ visible, onClose }) {
  const [activePreset, setActivePreset] = useState('flat');
  const [spatialMode, setSpatialMode] = useState('off');
  const [isKaraoke, setIsKaraoke] = useState(false);
  const [activeAura, setActiveAura] = useState('crimson');

  const presets = [
    { id: 'flat', label: 'Flat / Off' },
    { id: 'bassBoost', label: 'Bass Boost' },
    { id: 'vocalEnhancer', label: 'Vocal Enhancer' },
    { id: 'electronicHype', label: 'Electronic Hype' },
    { id: 'cyberpunk', label: 'Cyberpunk' }
  ];

  const spatialModes = [
    { id: 'off', label: 'Off' },
    { id: 'studio', label: 'Studio Room' },
    { id: 'concert', label: 'Concert Hall' },
    { id: 'cyberspace', label: 'Cyber Space 3D' }
  ];

  const auraThemes = [
    { id: 'crimson', label: 'Cyber Crimson', color: '#FF0055' },
    { id: 'purple', label: 'Cosmic Violet', color: '#9D00FF' },
    { id: 'emerald', label: 'Neon Emerald', color: '#00FF88' },
    { id: 'gold', label: 'Sunset Amber', color: '#FFB700' }
  ];

  const handleToggleKaraoke = () => {
    const next = !isKaraoke;
    setIsKaraoke(next);
    Alert.alert(
      'Karaoke Sing-Along Mode',
      next ? '🎤 Sing-Along Karaoke Mode ENABLED!\nVocal frequencies attenuated.' : 'Karaoke Mode Disabled.'
    );
  };

  const handleSelectPreset = (id) => {
    setActivePreset(id);
    Alert.alert('Equalizer Preset', `EQ profile updated to: ${id.toUpperCase()}`);
  };

  const handleSelectSpatial = (id) => {
    setSpatialMode(id);
    Alert.alert('3D Spatial Audio', `Acoustic Environment: ${id.toUpperCase()}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>🎛️ SoundWave FX Studio</Text>
              <Text style={styles.subtitle}>Mobile Equalizer, 3D Audio & Aura Engine</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Karaoke Banner */}
            <View style={styles.karaokeCard}>
              <View style={styles.karaokeMeta}>
                <Ionicons name="mic-outline" size={28} color={colors.primary} />
                <View style={{ marginLeft: spacing.md, flex: 1 }}>
                  <Text style={styles.karaokeTitle}>Sing-Along Karaoke Mode</Text>
                  <Text style={styles.karaokeSub}>Filters vocal frequencies for live sing-along</Text>
                </View>
              </View>
              <Pressable
                style={[styles.actionBtn, isKaraoke && styles.actionBtnActive]}
                onPress={handleToggleKaraoke}
              >
                <Text style={[styles.actionBtnText, isKaraoke && styles.actionBtnTextActive]}>
                  {isKaraoke ? 'Enabled 🎤' : 'Enable'}
                </Text>
              </Pressable>
            </View>

            {/* EQ Presets */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5-Band Graphic EQ Profiles</Text>
              <View style={styles.pillGrid}>
                {presets.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[styles.pill, activePreset === p.id && styles.pillActive]}
                    onPress={() => handleSelectPreset(p.id)}
                  >
                    <Text style={[styles.pillText, activePreset === p.id && styles.pillTextActive]}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 3D Spatial Audio */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3D Spatial Acoustic Environment</Text>
              <View style={styles.pillGrid}>
                {spatialModes.map((s) => (
                  <Pressable
                    key={s.id}
                    style={[styles.pill, spatialMode === s.id && styles.pillActive]}
                    onPress={() => handleSelectSpatial(s.id)}
                  >
                    <Text style={[styles.pillText, spatialMode === s.id && styles.pillTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* SoundWave Aura Theme */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SoundWave Aura Mood Theme</Text>
              <View style={styles.pillGrid}>
                {auraThemes.map((a) => (
                  <Pressable
                    key={a.id}
                    style={[
                      styles.pill,
                      activeAura === a.id && { backgroundColor: a.color, borderColor: a.color }
                    ]}
                    onPress={() => setActiveAura(a.id)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        activeAura === a.id && { color: '#FFF', fontWeight: 'bold' }
                      ]}
                    >
                      {a.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#12121A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  karaokeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,0,85,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,85,0.3)',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  karaokeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  karaokeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  karaokeSub: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  actionBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
  },
  actionBtnActive: {
    backgroundColor: colors.primary,
  },
  actionBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 4,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 4,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
