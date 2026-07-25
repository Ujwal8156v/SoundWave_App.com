import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  FlatList,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import AudioFxModal from './AudioFxModal';

const { width } = Dimensions.get('window');

const lyricsDatabase = {
  "blue eyes": [
    { time: 0, text: "🎵 Blue Eyes - Yo Yo Honey Singh 🎵" },
    { time: 5, text: "Blue eyes, hypnotise teri kardi ai mennu" },
    { time: 10, text: "I swear! Chhoti dress mein bomb lagdi mennu" },
    { time: 15, text: "Gharon baahar na nikalya kar" },
    { time: 20, text: "Ni taan lag ju nazar tennu" },
    { time: 25, text: "Blue eyes, hypnotise teri kardi ai mennu" },
    { time: 30, text: "I swear! Chhoti dress mein bomb lagdi mennu" },
    { time: 35, text: "🎵 Instrumental Solo 🎵" },
    { time: 45, text: "Gharon baahar na nikalya kar" },
    { time: 50, text: "Ni taan lag ju nazar tennu..." }
  ],
  "default": [
    { time: 0, text: "🎵 Stream original soundtrack on SoundWaves 🎵" },
    { time: 5, text: "Yeah, vibe the moment with SoundWaves..." },
    { time: 12, text: "Feel the base line kickin'..." },
    { time: 18, text: "And the high hats rollin'..." },
    { time: 25, text: "This is a premium streaming experience." },
    { time: 32, text: "Autoplay, dynamic queues, and offline caches." },
    { time: 40, text: "Music is life. Enjoy the beats!" }
  ]
};

export default function PlayerModal({ 
  visible, 
  song, 
  isPlaying, 
  liked,
  position,
  duration,
  sleepTimerRemaining,
  queue,
  onClose, 
  onToggle, 
  onNext, 
  onPrevious,
  onLike,
  onPlaySong,
  onTriggerSleepTimer,
  onSeek
}) {
  const [isFxModalVisible, setIsFxModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('upnext');
  const lyricsScrollRef = useRef(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState(0);
  const sliderWidthRef = useRef(0);

  if (!song) return null;

  const progressPercent = isDragging 
    ? dragPercent 
    : (duration > 0 ? (position / duration) * 100 : 0);

  const displayPosition = isDragging 
    ? (dragPercent / 100) * duration 
    : position;
  
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const handleTouchStart = (evt) => {
    setIsDragging(true);
    updateDrag(evt);
  };

  const handleTouchMove = (evt) => {
    updateDrag(evt);
  };

  const handleTouchEnd = (evt) => {
    if (duration > 0) {
      // Calculate target seek percentage from final layout touch
      const touchX = evt.nativeEvent.locationX;
      const pct = Math.max(0, Math.min(100, (touchX / sliderWidthRef.current) * 100));
      const targetTime = (pct / 100) * duration;
      if (onSeek) onSeek(targetTime);
    }
    setIsDragging(false);
  };

  const updateDrag = (evt) => {
    if (sliderWidthRef.current > 0) {
      const touchX = evt.nativeEvent.locationX;
      const pct = Math.max(0, Math.min(100, (touchX / sliderWidthRef.current) * 100));
      setDragPercent(pct);
    }
  };

  const onSliderLayout = (e) => {
    sliderWidthRef.current = e.nativeEvent.layout.width;
  };

  const getLyrics = () => {
    const titleLower = song.title.toLowerCase();
    if (titleLower.includes('blue eyes')) {
      return lyricsDatabase["blue eyes"];
    }
    return lyricsDatabase.default;
  };

  const lyrics = getLyrics();

  // Find active lyric index
  let activeLyricIdx = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (position >= lyrics[i].time) {
      activeLyricIdx = i;
    } else {
      break;
    }
  }

  // Scroll lyrics container automatically when active line changes
  useEffect(() => {
    if (activeTab === 'lyrics' && lyricsScrollRef.current) {
      lyricsScrollRef.current.scrollTo({
        y: activeLyricIdx * 40 - 80,
        animated: true
      });
    }
  }, [activeLyricIdx, activeTab]);

  const renderQueueItem = ({ item }) => {
    const isActive = item.id === song.id;
    return (
      <Pressable 
        style={[styles.songItem, isActive && styles.songItemActive]}
        onPress={() => onPlaySong(item)}
      >
        <Image source={{ uri: item.coverArt }} style={styles.songItemImg} />
        <View style={styles.songItemMeta}>
          <Text style={[styles.songItemTitle, isActive && { color: colors.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songItemArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={onClose}>
            <Ionicons name="chevron-down" size={28} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            NOW PLAYING {sleepTimerRemaining > 0 ? `(${formatTime(sleepTimerRemaining)})` : ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable style={styles.iconButton} onPress={() => setIsFxModalVisible(true)}>
              <Ionicons name="options-outline" size={24} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={onTriggerSleepTimer}>
              <Ionicons 
                name="alarm-outline" 
                size={24} 
                color={sleepTimerRemaining > 0 ? colors.primary : colors.text} 
              />
            </Pressable>
          </View>
        </View>

        {/* Dynamic Display (Album Artwork OR scrolling lyrics OR queue lists) */}
        <View style={styles.displayArea}>
          {activeTab === 'upnext' && (
            <View style={styles.tabContainer}>
              <Text style={styles.tabHeadline}>Up Next Queue</Text>
              <FlatList
                data={queue}
                renderItem={renderQueueItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {activeTab === 'artwork' && (
            <View style={styles.artworkContainer}>
              <Image 
                source={{ uri: song.coverArt || 'https://via.placeholder.com/400' }} 
                style={styles.artwork} 
              />
            </View>
          )}

          {activeTab === 'lyrics' && (
            <View style={styles.tabContainer}>
              <Text style={styles.tabHeadline}>Synced Lyrics</Text>
              <ScrollView 
                ref={lyricsScrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 100 }}
              >
                {lyrics.map((line, idx) => {
                  const isActive = idx === activeLyricIdx;
                  return (
                    <Text 
                      key={idx} 
                      style={[styles.lyricLine, isActive && styles.lyricLineActive]}
                    >
                      {line.text}
                    </Text>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {activeTab === 'related' && (
            <View style={styles.tabContainer}>
              <Text style={styles.tabHeadline}>Recommended Tracks</Text>
              <FlatList
                data={queue.filter(s => s.id !== song.id).slice(0, 5)}
                renderItem={renderQueueItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </View>

        {/* Song Info & Like Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaText}>
            <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
            <Pressable 
              onPress={() => {
                Alert.alert(
                  'Ringtone Configured',
                  `"${song.title}" by ${song.artist} has been set as your device ringtone successfully!`
                );
              }} 
              style={{ padding: 5 }}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.likeButton} onPress={() => onLike(song.id)}>
              <Ionicons 
                name={liked ? 'heart' : 'heart-outline'} 
                size={28} 
                color={colors.danger} 
              />
            </Pressable>
          </View>
        </View>

        {/* Seek/Progress Bar */}
        <View style={styles.progressContainer}>
          <View 
            style={{ width: '100%', height: 24, justifyContent: 'center' }} 
            onLayout={onSliderLayout}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <View style={styles.sliderBg}>
              <View style={[styles.sliderFill, { width: `${progressPercent}%` }]} />
              <View style={[styles.sliderKnob, { left: `${progressPercent}%`, top: -3 }]} />
            </View>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(displayPosition)}</Text>
            <Text style={styles.timeText}>{formatTime(duration || song.duration)}</Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsRow}>
          <Pressable style={styles.subControl} onPress={() => setActiveTab('artwork')}>
            <Ionicons 
              name="image-outline" 
              size={24} 
              color={activeTab === 'artwork' ? colors.primary : colors.muted} 
            />
          </Pressable>
          
          <Pressable style={styles.controlBtn} onPress={onPrevious}>
            <Ionicons name="play-skip-back" size={28} color={colors.text} />
          </Pressable>
          
          <Pressable style={styles.mainPlayBtn} onPress={onToggle}>
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={36} 
              color={colors.text} 
              style={{ marginLeft: isPlaying ? 0 : 4 }}
            />
          </Pressable>
          
          <Pressable style={styles.controlBtn} onPress={onNext}>
            <Ionicons name="play-skip-forward" size={28} color={colors.text} />
          </Pressable>
          
          <Pressable style={styles.subControl} onPress={onTriggerSleepTimer}>
            <Ionicons 
              name="time-outline" 
              size={24} 
              color={sleepTimerRemaining > 0 ? colors.primary : colors.muted} 
            />
          </Pressable>
        </View>

        {/* Bottom Tab Layout */}
        <View style={styles.footerTabs}>
          <Pressable 
            style={activeTab === 'upnext' ? styles.footerTabActive : styles.footerTab}
            onPress={() => setActiveTab('upnext')}
          >
            <Text style={activeTab === 'upnext' ? styles.footerTabTextActive : styles.footerTabText}>UP NEXT</Text>
          </Pressable>
          <Pressable 
            style={activeTab === 'lyrics' ? styles.footerTabActive : styles.footerTab}
            onPress={() => setActiveTab('lyrics')}
          >
            <Text style={activeTab === 'lyrics' ? styles.footerTabTextActive : styles.footerTabText}>LYRICS</Text>
          </Pressable>
          <Pressable 
            style={activeTab === 'related' ? styles.footerTabActive : styles.footerTab}
            onPress={() => setActiveTab('related')}
          >
            <Text style={activeTab === 'related' ? styles.footerTabTextActive : styles.footerTabText}>RELATED</Text>
          </Pressable>
        </View>

        <AudioFxModal
          visible={isFxModalVisible}
          onClose={() => setIsFxModalVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    paddingBottom: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 56
  },
  headerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  iconButton: {
    padding: spacing.sm
  },
  displayArea: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 10,
    minHeight: 280
  },
  tabContainer: {
    flex: 1,
    paddingHorizontal: 24
  },
  tabHeadline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36
  },
  artwork: {
    width: width - 72,
    height: width - 72,
    borderRadius: 12,
    backgroundColor: '#000'
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1
  },
  songItemActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 0, 0, 0.05)'
  },
  songItemImg: {
    width: 44,
    height: 44,
    borderRadius: 4,
    marginRight: spacing.md
  },
  songItemMeta: {
    flex: 1
  },
  songItemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold'
  },
  songItemArtist: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  lyricLine: {
    fontSize: 18,
    lineHeight: 40,
    color: colors.muted,
    textAlign: 'center',
    opacity: 0.4,
    fontWeight: '500'
  },
  lyricLineActive: {
    fontSize: 22,
    color: colors.primary,
    opacity: 1,
    fontWeight: 'bold'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginVertical: 5
  },
  metaText: {
    flex: 1,
    marginRight: 16
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800'
  },
  artist: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 2
  },
  likeButton: {
    padding: spacing.sm
  },
  progressContainer: {
    paddingHorizontal: 28,
    marginVertical: 10
  },
  sliderBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#3F3F3F',
    borderRadius: 2,
    position: 'relative',
    justifyContent: 'center'
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2
  },
  sliderKnob: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: -5
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  timeText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500'
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginVertical: 5
  },
  subControl: {
    padding: spacing.sm
  },
  controlBtn: {
    padding: spacing.md
  },
  mainPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md
  },
  footerTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm
  },
  footerTabActive: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary
  },
  footerTabText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1
  },
  footerTabTextActive: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  }
});
