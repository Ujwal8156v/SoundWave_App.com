import { FlatList, StyleSheet, Text, View } from 'react-native';

import SongCard from '../components/SongCard';
import { colors, spacing } from '../theme';

export default function HomeScreen({ songs, currentSong, liked, onPlay, onLike, onAddToPlaylist }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.kicker}>SW</Text>
        <Text style={styles.title}>Vibe the moment with 🔊Waves</Text>
      </View>
      <FlatList
        data={songs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={5}
        renderItem={({ item }) => (
          <SongCard
            song={item}
            active={currentSong?.id === item.id}
            liked={liked?.has(item.id)}
            onPress={onPlay}
            onLike={onLike}
            onAddToPlaylist={onAddToPlaylist}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.xs
  },
  kicker: {
    color: colors.primary,
    backgroundColor: 'rgba(255, 0, 60, 0.08)',
    borderColor: 'rgba(255, 0, 60, 0.25)',
    borderWidth: 1,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: spacing.xs
  },
  list: {
    gap: spacing.md,
    padding: spacing.lg
  }
});