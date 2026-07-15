import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import SongCard from '../components/SongCard';
import { colors, spacing } from '../theme';

export default function SearchScreen({ onSearch, results, currentSong, liked, onPlay, onLike, onAddToPlaylist }) {
  const [localQuery, setLocalQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(localQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [localQuery]);

  const suggestions = useMemo(() => {
    if (!localQuery.trim()) return [];
    const normalized = localQuery.trim().toLowerCase();
    const matches = new Set();

    results.forEach((song) => {
      if (song.title.toLowerCase().includes(normalized)) {
        matches.add(song.title);
      }
      if (song.artist.toLowerCase().includes(normalized)) {
        matches.add(song.artist);
      }
      if (song.genre && song.genre.toLowerCase().includes(normalized)) {
        matches.add(song.genre);
      }
    });

    return Array.from(matches).slice(0, 5);
  }, [localQuery, results]);

  return (
    <View style={styles.screen}>
      <TextInput
        autoCapitalize="none"
        placeholder="Search songs, artists, moods"
        placeholderTextColor={colors.muted}
        value={localQuery}
        onChangeText={setLocalQuery}
        style={styles.input}
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={suggestions}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.suggestionsList}
            renderItem={({ item }) => (
              <Pressable
                style={styles.suggestionChip}
                onPress={() => setLocalQuery(item)}
              >
                <Text style={styles.suggestionText}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      <FlatList
        data={results}
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
    flex: 1,
    paddingTop: spacing.lg
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    marginHorizontal: spacing.lg,
    minHeight: 52,
    paddingHorizontal: spacing.md
  },
  list: {
    gap: spacing.md,
    padding: spacing.lg
  },
  suggestionsContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg
  },
  suggestionsList: {
    gap: spacing.sm
  },
  suggestionChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  suggestionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600'
  }
});