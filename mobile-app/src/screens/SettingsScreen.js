import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

export default function SettingsScreen({ onBack }) {
  const [restrictedMode, setRestrictedMode] = useState(false);
  const [allowExternalPlayback, setAllowExternalPlayback] = useState(false);
  const [doubleTapSeek, setDoubleTapSeek] = useState(false);
  const [dynamicQueue, setDynamicQueue] = useState(false);
  const [showDeviceFiles, setShowDeviceFiles] = useState(false);
  const [downloadWifiOnly, setDownloadWifiOnly] = useState(false);
  const [smartDownload, setSmartDownload] = useState(false);
  const [saveRecentSongs, setSaveRecentSongs] = useState(false);
  const [musicRecommendations, setMusicRecommendations] = useState(false);
  const [playlistUpdates, setPlaylistUpdates] = useState(false);

  const [audioQuality, setAudioQuality] = useState('medium');
  const [storageText, setStorageText] = useState('Used: 142 MB / Available: 4.8 GB');
  const [currentPlan, setCurrentPlan] = useState('Free');

  useEffect(() => {
    loadSettings();
    AsyncStorage.getItem('settings_currentPlan').then(val => {
      if (val) setCurrentPlan(val);
    }).catch(() => null);
  }, []);

  function handleSelectPlan() {
    Alert.alert(
      'Choose Your Plan',
      'Select a subscription plan tailored to your music lifestyle:',
      [
        {
          text: `Free Tier (₹0/mo) ${currentPlan === 'Free' ? '[Active]' : ''}`,
          onPress: () => {
            setCurrentPlan('Free');
            AsyncStorage.setItem('settings_currentPlan', 'Free');
            Alert.alert('Plan Activated', 'You are now on the Free Tier.');
          }
        },
        {
          text: `SoundWave Plus (₹59/mo) ${currentPlan === 'Plus' ? '[Active]' : ''}`,
          onPress: () => {
            setCurrentPlan('Plus');
            AsyncStorage.setItem('settings_currentPlan', 'Plus');
            Alert.alert('Welcome to Plus!', 'You are now subscribed to SoundWave Plus (₹59/month).');
          }
        },
        {
          text: `Family Premium (₹179/mo) ${currentPlan === 'Family' ? '[Active]' : ''}`,
          onPress: () => {
            setCurrentPlan('Family');
            AsyncStorage.setItem('settings_currentPlan', 'Family');
            Alert.alert('Welcome to Family!', 'You are now subscribed to Family Premium (₹179/month).');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  async function loadSettings() {
    try {
      const keys = [
        'restrictedMode', 'allowExternalPlayback', 'doubleTapSeek', 'dynamicQueue',
        'showDeviceFiles', 'downloadWifiOnly', 'smartDownload', 'saveRecentSongs',
        'musicRecommendations', 'playlistUpdates'
      ];
      for (const key of keys) {
        const val = await AsyncStorage.getItem(`settings_${key}`);
        if (val !== null) {
          const isTrue = val === 'true';
          if (key === 'restrictedMode') setRestrictedMode(isTrue);
          else if (key === 'allowExternalPlayback') setAllowExternalPlayback(isTrue);
          else if (key === 'doubleTapSeek') setDoubleTapSeek(isTrue);
          else if (key === 'dynamicQueue') setDynamicQueue(isTrue);
          else if (key === 'showDeviceFiles') setShowDeviceFiles(isTrue);
          else if (key === 'downloadWifiOnly') setDownloadWifiOnly(isTrue);
          else if (key === 'smartDownload') setSmartDownload(isTrue);
          else if (key === 'saveRecentSongs') setSaveRecentSongs(isTrue);
          else if (key === 'musicRecommendations') setMusicRecommendations(isTrue);
          else if (key === 'playlistUpdates') setPlaylistUpdates(isTrue);
        }
      }
      const quality = await AsyncStorage.getItem('settings_audioQuality');
      if (quality) setAudioQuality(quality);
    } catch (e) {
      console.log('Failed to load settings from AsyncStorage', e);
    }
  }

  async function saveSetting(key, val) {
    try {
      await AsyncStorage.setItem(`settings_${key}`, String(val));
    } catch (e) {
      console.log('Failed to save setting', e);
    }
  }

  function handleQualityCycle() {
    const next = audioQuality === 'high' ? 'medium' : audioQuality === 'medium' ? 'low' : 'high';
    setAudioQuality(next);
    AsyncStorage.setItem('settings_audioQuality', next).catch(() => null);
    Alert.alert('Audio Quality', `Stream quality set to: ${next.toUpperCase()}`);
  }

  function handleClearDownloads() {
    Alert.alert(
      'Clear Downloads',
      'Are you sure you want to delete all cached downloads? This will free up 142 MB of device space.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setStorageText('Used: 0 B / Available: 4.9 GB');
            Alert.alert('Cleared', 'Downloads cache cleared successfully.');
          }
        }
      ]
    );
  }

  function handleSetRingtone() {
    Alert.alert(
      'Set a Ringtone',
      'Select a song from your library catalog to configure as your phone ringtone:',
      [
        {
          text: 'Midnight Dreams',
          onPress: () => Alert.alert('Ringtone Configured', '"Midnight Dreams" by Luna Echo has been set as your device ringtone successfully!')
        },
        {
          text: 'Blue Eyes',
          onPress: () => Alert.alert('Ringtone Configured', '"Blue Eyes" by Yo Yo Honey Singh has been set as your device ringtone successfully!')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent}>
        {/* Membership & Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership & Plans</Text>
          <TouchableOpacity style={styles.row} onPress={handleSelectPlan}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Choose Plan</Text>
              <Text style={styles.rowDesc}>Active Plan: {currentPlan}</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>Select</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Restricted Mode</Text>
              <Text style={styles.rowDesc}>Restricted mode for multiple devices use</Text>
            </View>
            <Switch
              value={restrictedMode}
              onValueChange={(val) => {
                setRestrictedMode(val);
                saveSetting('restrictedMode', val);
              }}
              trackColor={{ false: '#3f3f3f', true: colors.primary }}
            />
          </View>
        </View>

        {/* Playback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>
          
          <TouchableOpacity
            style={styles.row}
            onPress={() => Alert.alert('Equaliser', 'Equaliser adjusted to "Smart Dynamic Bass Boost" mode successfully!')}
          >
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Equaliser</Text>
              <Text style={styles.rowDesc}>Adjust audio frequency curves</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>Adjust</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>External Device Control</Text>
              <Text style={styles.rowDesc}>Allow external devices to start playback</Text>
            </View>
            <Switch
              value={allowExternalPlayback}
              onValueChange={(val) => {
                setAllowExternalPlayback(val);
                saveSetting('allowExternalPlayback', val);
              }}
              trackColor={{ false: '#3f3f3f', true: colors.primary }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Double-Tap to Seek</Text>
              <Text style={styles.rowDesc}>Double-tap side of player to seek 10s</Text>
            </View>
            <Switch
              value={doubleTapSeek}
              onValueChange={(val) => {
                setDoubleTapSeek(val);
                saveSetting('doubleTapSeek', val);
              }}
              trackColor={{ false: '#3f3f3f', true: colors.primary }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Dynamic Queue</Text>
              <Text style={styles.rowDesc}>Enable smart recommendations queue</Text>
            </View>
            <Switch
              value={dynamicQueue}
              onValueChange={(val) => {
                setDynamicQueue(val);
                saveSetting('dynamicQueue', val);
              }}
              trackColor={{ false: '#3f3f3f', true: colors.primary }}
            />
          </View>

          <TouchableOpacity
            style={styles.row}
            onPress={handleSetRingtone}
          >
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Set a Ringtone</Text>
              <Text style={styles.rowDesc}>Use a library track as phone ringtone</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>Configure</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Download & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Download & Storage</Text>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Storage Space</Text>
              <Text style={styles.rowDesc}>{storageText}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Show Device Files</Text>
              <Text style={styles.rowDesc}>Show device files in library list</Text>
            </View>
            <Switch
              value={showDeviceFiles}
              onValueChange={(val) => {
                setShowDeviceFiles(val);
                saveSetting('showDeviceFiles', val);
              }}
              trackColor={{ false: '#3f3f3f', true: colors.primary }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Download over Wi-Fi only</Text>
              <Text style={styles.rowDesc}>Will only use Wi-Fi networks for downloads</Text>
            </View>
            <Switch
              value={downloadWifiOnly}
              onValueChange={(val) => {
                setDownloadWifiOnly(val);
                saveSetting('downloadWifiOnly', val);
              }}
              trackColor={{ false: '#3f3f3f', true: colors.primary }}
            />
          </View>

          <TouchableOpacity style={styles.row} onPress={handleQualityCycle}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Audio Quality</Text>
              <Text style={styles.rowDesc}>Configure target audio stream bitrate</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{audioQuality.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Smart Download</Text>
              <Text style={styles.rowDesc}>Only download songs added to loved library</Text>
            </View>
            <Switch
              value={smartDownload}
              onValueChange={(val) => {
                setSmartDownload(val);
                saveSetting('smartDownload', val);
              }}
              trackColor={{ false: '#3f3f3f', true: colors.primary }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Recently Played Songs</Text>
              <Text style={styles.rowDesc}>Save history of recently played tracks</Text>
            </View>
            <Switch
              value={saveRecentSongs}
              onValueChange={(val) => {
                setSaveRecentSongs(val);
                saveSetting('saveRecentSongs', val);
              }}
              trackColor={{ false: '#3f3f3f', true: colors.primary }}
            />
          </View>

          <TouchableOpacity style={styles.row} onPress={handleClearDownloads}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Clear Downloads</Text>
              <Text style={styles.rowDesc}>Delete all downloaded files from storage</Text>
            </View>
            <View style={[styles.actionBadge, { borderColor: '#ef4444' }]}>
              <Text style={[styles.actionBadgeText, { color: '#ef4444' }]}>Clear</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Music Recommendation Notifications</Text>
              <Text style={styles.rowDesc}>Receive updates about similar releases</Text>
            </View>
            <Switch
              value={musicRecommendations}
              onValueChange={(val) => {
                setMusicRecommendations(val);
                saveSetting('musicRecommendations', val);
              }}
              trackColor={{ false: '#3f3f3f', true: colors.primary }}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Playlist Update Notifications</Text>
              <Text style={styles.rowDesc}>Notify when shared playlists update</Text>
            </View>
            <Switch
              value={playlistUpdates}
              onValueChange={(val) => {
                setPlaylistUpdates(val);
                saveSetting('playlistUpdates', val);
              }}
              trackColor={{ false: '#3f3f3f', true: colors.primary }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    padding: spacing.xs
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.lg
  },
  body: {
    flex: 1
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40
  },
  section: {
    marginBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  rowInfo: {
    flex: 1,
    paddingRight: spacing.md
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  rowDesc: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2
  },
  actionBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.xs,
    paddingHorizontal: 12,
    backgroundColor: colors.surface
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text
  }
});
