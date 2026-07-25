import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';
import { compactNumber, formatDuration } from '../utils/format';

export default function SongCard({ song, active, liked, onPress, onLike, onAddToPlaylist }) {
  return (
    <Pressable 
      style={[styles.card, active && styles.active]} 
      onPress={() => onPress(song)}
      android_ripple={{ color: 'rgba(255, 0, 60, 0.15)', borderless: false }}
    >
      <View style={styles.cover}>
        <Image 
          source={{ uri: song.coverArt || 'https://via.placeholder.com/150' }} 
          style={styles.coverImage} 
        />
        {active && (
          <View style={styles.activeOverlay}>
            <Ionicons name="volume-high" size={20} color={colors.primary} />
          </View>
        )}
      </View>
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{song.artist} · {song.genre}</Text>
        <Text style={styles.stats}>{formatDuration(song.duration)} · {compactNumber(song.plays)} plays</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.iconButton} onPress={() => onLike(song.id)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={colors.danger} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => onAddToPlaylist(song.id)}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  active: {
    borderColor: colors.primary
  },
  cover: {
    width: 54,
    height: 54,
    borderRadius: 6,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden'
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6
  },
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  details: {
    flex: 1,
    gap: 3
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700'
  },
  meta: {
    color: colors.muted,
    fontSize: 12
  },
  stats: {
    color: colors.accent,
    fontSize: 11
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center'
  }
});