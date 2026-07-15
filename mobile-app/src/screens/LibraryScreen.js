import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';

export default function LibraryScreen({ likedCount, playlists, onCreatePlaylist, onDeletePlaylist, onSelectPlaylist }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Your library</Text>
      <View style={styles.row}>
        <View style={styles.tile}>
          <Ionicons name="heart" size={28} color={colors.danger} />
          <Text style={styles.tileNumber}>{likedCount}</Text>
          <Text style={styles.tileLabel}>Liked songs</Text>
        </View>
        <View style={styles.tile}>
          <Ionicons name="list" size={28} color={colors.accent} />
          <Text style={styles.tileNumber}>{playlists.length}</Text>
          <Text style={styles.tileLabel}>Playlists</Text>
        </View>
      </View>

      <Pressable style={styles.action} onPress={onCreatePlaylist}>
        <Ionicons name="add" size={22} color={colors.background} />
        <Text style={styles.actionText}>Create playlist</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Playlists</Text>
      <FlatList
        data={playlists}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No playlists created yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.playlistItem} onPress={() => onSelectPlaylist(item)}>
            <View style={styles.playlistIcon}>
              <Ionicons name="musical-notes" size={20} color={colors.text} />
            </View>
            <View style={styles.playlistDetails}>
              <Text style={styles.playlistName}>{item.name}</Text>
              <Text style={styles.playlistMeta}>
                {item.songs ? item.songs.length : 0} songs
              </Text>
            </View>
            <Pressable style={styles.deleteButton} onPress={() => onDeletePlaylist(item.id)}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: spacing.lg
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: spacing.lg
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md
  },
  tile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    minHeight: 132,
    padding: spacing.md
  },
  tileNumber: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900'
  },
  tileLabel: {
    color: colors.muted,
    fontWeight: '700'
  },
  action: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 52
  },
  actionText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '900'
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: spacing.lg,
    marginBottom: spacing.sm
  },
  list: {
    gap: spacing.sm,
    paddingVertical: spacing.sm
  },
  playlistItem: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    padding: spacing.md
  },
  playlistIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  playlistDetails: {
    flex: 1
  },
  playlistName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700'
  },
  playlistMeta: {
    color: colors.muted,
    fontSize: 13
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: spacing.lg
  },
  deleteButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36
  }
});