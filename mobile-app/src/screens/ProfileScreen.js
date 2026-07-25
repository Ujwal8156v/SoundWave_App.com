import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

export default function ProfileScreen({
  user,
  email,
  setEmail,
  password,
  setPassword,
  onLogin,
  onRegister,
  onLogout,
  onUpdateProfile,
  onOpenSettings
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  function startEditing() {
    setEditUsername(user.username || '');
    setEditBio(user.bio || '');
    setEditAvatar(user.avatar || '');
    setIsEditing(true);
  }

  function handleSave() {
    if (!editUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    onUpdateProfile({
      username: editUsername,
      bio: editBio,
      avatar: editAvatar
    });
    setIsEditing(false);
  }

  function handlePresetAvatar() {
    Alert.alert(
      'Choose Profile Picture',
      'Select a preset avatar template or enter a custom URL:',
      [
        {
          text: '🎧 Neon Beats',
          onPress: () => setEditAvatar('https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=150')
        },
        {
          text: '🎸 Rock Star',
          onPress: () => setEditAvatar('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150')
        },
        {
          text: '🎵 Synth Wave',
          onPress: () => setEditAvatar('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150')
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  const [authMode, setAuthMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);

  const handleQuickDemoLogin = () => {
    setEmail('demo@soundwave.com');
    setPassword('soundwave123');
    onLogin();
  };

  // Logged-out Login/Register View
  if (!user) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to SoundWave</Text>
        </View>
        <Text style={styles.copy}>Sign in to sync likes, playlists, 320kbps streams, and spatial audio.</Text>

        {/* Segmented Auth Tabs */}
        <View style={styles.tabSwitcher}>
          <Pressable 
            style={[styles.tabSegment, authMode === 'login' && styles.tabSegmentActive]}
            onPress={() => setAuthMode('login')}
          >
            <Text style={[styles.tabSegmentText, authMode === 'login' && styles.tabSegmentTextActive]}>🔑 Login</Text>
          </Pressable>
          <Pressable 
            style={[styles.tabSegment, authMode === 'register' && styles.tabSegmentActive]}
            onPress={() => setAuthMode('register')}
          >
            <Text style={[styles.tabSegmentText, authMode === 'register' && styles.tabSegmentTextActive]}>✍️ Register</Text>
          </Pressable>
        </View>

        {/* 1-Click Quick Demo Login */}
        <Pressable style={styles.demoBtn} onPress={handleQuickDemoLogin}>
          <Text style={styles.demoBtnText}>⚡ 1-Click Quick Demo Login (Instant Access)</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR WITH EMAIL</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email address"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        
        <View style={styles.passwordWrap}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.actions}>
          {authMode === 'login' ? (
            <Pressable style={styles.primary} onPress={onLogin}>
              <Text style={styles.primaryText}>Sign In 🚀</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.primary} onPress={onRegister}>
              <Text style={styles.primaryText}>Create Free Account ✨</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // Logged-in View
  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {!isEditing && (
          <Pressable onPress={onOpenSettings} style={styles.settingsIcon}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.profileBody}>
        {isEditing ? (
          // Editing Mode
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: editAvatar || 'https://via.placeholder.com/150' }} style={styles.avatar} />
              <Pressable style={styles.presetButton} onPress={handlePresetAvatar}>
                <Text style={styles.presetButtonText}>Choose Preset Avatar</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Profile Picture URL</Text>
            <TextInput
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={colors.muted}
              value={editAvatar}
              onChangeText={setEditAvatar}
              style={styles.input}
            />

            <Text style={styles.label}>Or Generate Avatar from Interest (e.g. coding, cat, rock)</Text>
            <TextInput
              placeholder="Type any interest (e.g. gaming, guitar, coding)..."
              placeholderTextColor={colors.muted}
              onChangeText={(text) => {
                if (text.trim()) {
                  setEditAvatar(`https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(text.trim().toLowerCase())}`);
                }
              }}
              style={styles.input}
            />

            <Text style={styles.label}>Username</Text>
            <TextInput
              placeholder="Username"
              placeholderTextColor={colors.muted}
              value={editUsername}
              onChangeText={setEditUsername}
              style={styles.input}
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              placeholder="Biography"
              placeholderTextColor={colors.muted}
              value={editBio}
              onChangeText={setEditBio}
              multiline
              style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
            />

            <View style={styles.actions}>
              <Pressable style={styles.primary} onPress={handleSave}>
                <Text style={styles.primaryText}>Save</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => setIsEditing(false)}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          // Read-Only Mode
          <View>
            <View style={styles.card}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: user.avatar || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                <Text style={styles.username}>@{user.username}</Text>
                <Text style={styles.email}>{user.email}</Text>
                {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
              </View>

              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{user.followers || 100}</Text>
                  <Text style={styles.statLbl}>Followers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{user.following || 50}</Text>
                  <Text style={styles.statLbl}>Following</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{user.likedSongs || 0}</Text>
                  <Text style={styles.statLbl}>Liked Songs</Text>
                </View>
              </View>

              <View style={styles.detailsGrid}>
                <View style={styles.detailBox}>
                  <Text style={styles.detailTitle}>🎧 Favorite Genre</Text>
                  <Text style={styles.detailVal}>{user.listeningStats?.favoriteGenre || 'Pop'}</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailTitle}>⏱️ Minutes Heard</Text>
                  <Text style={styles.detailVal}>{user.listeningStats?.totalMinutes || 0}m</Text>
                </View>
                <View style={styles.detailBox}>
                  <Text style={styles.detailTitle}>🎵 Songs Streamed</Text>
                  <Text style={styles.detailVal}>{user.listeningStats?.songsHeard || 0}</Text>
                </View>
              </View>

              <Pressable style={[styles.primary, { marginTop: spacing.md }]} onPress={startEditing}>
                <Text style={styles.primaryText}>Edit Profile</Text>
              </Pressable>

              <Pressable style={[styles.secondary, { marginTop: spacing.sm }]} onPress={onLogout}>
                <Text style={styles.secondaryText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900'
  },
  settingsIcon: {
    padding: spacing.xs
  },
  profileBody: {
    flex: 1
  },
  copy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
    marginTop: spacing.sm
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.md
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: '#3f3f3f',
    marginBottom: spacing.sm
  },
  presetButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginTop: spacing.xs
  },
  presetButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold'
  },
  username: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.xs
  },
  email: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 2
  },
  bio: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginVertical: spacing.md
  },
  statItem: {
    alignItems: 'center'
  },
  statVal: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold'
  },
  statLbl: {
    color: colors.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    marginTop: 2
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  detailBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    alignItems: 'center'
  },
  detailTitle: {
    fontSize: 10,
    color: colors.muted,
    marginBottom: 4,
    textAlign: 'center'
  },
  detailVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center'
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    textTransform: 'uppercase',
    marginTop: spacing.xs
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 25,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  tabSegment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 22
  },
  tabSegmentActive: {
    backgroundColor: colors.primary
  },
  tabSegmentText: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 13
  },
  tabSegmentTextActive: {
    color: colors.text,
    fontWeight: '700'
  },
  demoBtn: {
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md
  },
  demoBtnText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)'
  },
  dividerText: {
    paddingHorizontal: spacing.sm,
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 1
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  eyeBtn: {
    paddingHorizontal: spacing.sm
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md
  },
  primary: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center'
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  secondary: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: 'center'
  },
  secondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: 'bold'
  }
});