import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';

export default function NowPlayingBar({ song, isPlaying, onToggle, onNext, onPress, position, duration }) {
  if (!song) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.bar}>
      <Pressable style={styles.infoPressable} onPress={onPress}>
        <Image 
          source={{ uri: song.coverArt || 'https://via.placeholder.com/150' }} 
          style={styles.thumbnail} 
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
        </View>
      </Pressable>
      <View style={styles.controls}>
        <Pressable style={styles.iconButton} onPress={onToggle}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={colors.text} />
        </Pressable>
        {onNext && (
          <Pressable style={styles.iconButton} onPress={onNext}>
            <Ionicons name="play-skip-forward" size={24} color={colors.text} />
          </Pressable>
        )}
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.sm,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8
  },
  infoPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#000'
  },
  info: {
    flex: 1,
    justifyContent: 'center'
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700'
  },
  artist: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  iconButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: '#3F3F3F',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary
  }
});