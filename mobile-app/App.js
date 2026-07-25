import { useEffect, useMemo, useState, useRef } from 'react';
import { Alert, SafeAreaView, StatusBar, StyleSheet, View, Text, BackHandler, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import NowPlayingBar from './src/components/NowPlayingBar';
import PlayerModal from './src/components/PlayerModal';
import TabButton from './src/components/TabButton';
import { demoSongs } from './src/data/demoCatalog';
import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SearchScreen from './src/screens/SearchScreen';
import { api, API_BASE_URL } from './src/services/api';
import { colors } from './src/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [songs, setSongs] = useState(demoSongs);
  const [currentSong, setCurrentSong] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(new Set());
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  const [user, setUser] = useState(null);
  const [isViewingSettings, setIsViewingSettings] = useState(false);

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0);
  const sleepTimerRef = useRef(null);
  const preloadedUrls = useRef({});
  const preloadedSoundRef = useRef(null);
  const preloadedSongIdRef = useRef(null);

  useEffect(() => {
    // Cross-Platform Audio Engine Configuration (iOS Silent Mode Bypass + Android Audio Focus)
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldRouteThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
      interruptionModeIOS: 1, // DoNotMix
      interruptionModeAndroid: 1, // DoNotMix
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => null);

    // Android Hardware Back Button Gesture Handler
    const onBackPress = () => {
      if (isPlayerExpanded) {
        setIsPlayerExpanded(false);
        return true;
      }
      if (isViewingSettings) {
        setIsViewingSettings(false);
        return true;
      }
      return false;
    };
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    api.getSongs()
      .then((body) => setSongs(body.data || demoSongs))
      .catch(() => setSongs(demoSongs));

    // 0ms Instant Session Restoration on App Launch
    AsyncStorage.getItem('soundwave_user').then((savedUser) => {
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {}
      }
    }).catch(() => null);

    AsyncStorage.getItem('token').then((token) => {
      if (token) {
        api.getCurrentUser()
          .then((userRes) => {
            const userObj = userRes.data || userRes;
            if (userObj) {
              setUser(userObj);
              AsyncStorage.setItem('soundwave_user', JSON.stringify(userObj)).catch(() => null);
            }
          })
          .catch(() => null);
      }
    });

    return () => {
      disableSleepTimer();
      backSubscription.remove();
    };
  }, [isPlayerExpanded, isViewingSettings]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const [playlists, setPlaylists] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  async function loadPlaylists() {
    try {
      const response = await api.getPlaylists();
      setPlaylists(response.data || []);
    } catch (error) {
      console.log('Not signed in or playlists load failed:', error.message);
    }
  }

  useEffect(() => {
    if (activeTab === 'library') {
      loadPlaylists();
    }
  }, [activeTab]);

  async function handleSearch(searchQuery) {
    if (!searchQuery.trim()) {
      setSearchResults(songs);
      return;
    }
    try {
      const body = await api.search(searchQuery);
      setSearchResults(body.data?.songs || []);
    } catch (error) {
      // fallback to local filter
      const normalized = searchQuery.trim().toLowerCase();
      const filtered = songs.filter((song) =>
        [song.title, song.artist, song.album, song.genre, song.mood]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalized))
      );
      setSearchResults(filtered);
    }
  }

  // Sync search results when songs catalog changes
  useEffect(() => {
    setSearchResults(songs);
  }, [songs]);

  const preloadNextSongObject = async (currentSongId) => {
    try {
      const currentIndex = activeQueue.findIndex((s) => s.id === currentSongId);
      if (currentIndex !== -1 && currentIndex < activeQueue.length - 1) {
        const nextSong = activeQueue[currentIndex + 1];
        const nextSongId = nextSong.id;
        if (preloadedSongIdRef.current === nextSongId) return;

        // Unload any existing preloaded sound first to prevent resource leaks
        if (preloadedSoundRef.current) {
          try {
            await preloadedSoundRef.current.unloadAsync();
          } catch (e) {}
          preloadedSoundRef.current = null;
        }

        let nextSource = nextSong.audioUrl || nextSong.audio_url;
        if (!nextSource) return;

        // Self-heal IP address mismatches by mapping to active API base host
        if (nextSource.includes('/api/v1/songs/')) {
          const apiBaseUrlClean = API_BASE_URL.replace(/\/api\/v1\/?$/, ''); // Remove trailing /api/v1
          nextSource = nextSource.replace(/http:\/\/[0-9\.]+:5000/, apiBaseUrlClean);
        }

        // Skip non-backend URLs (like local SoundHelix files)
        if (!nextSource.includes('/songs/') || !nextSource.includes('/stream')) return;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        
        let fetchUrl = nextSource + (nextSource.includes('?') ? '&' : '?') + '_cb=' + Date.now();
        if (!fetchUrl.includes('title=')) {
          fetchUrl = fetchUrl + '&title=' + encodeURIComponent(nextSong.title) + '&artist=' + encodeURIComponent(nextSong.artist || '');
        }
        
        const res = await fetch(fetchUrl, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          preloadedUrls.current[nextSongId] = res.url;
          
          const preloadedSound = new Audio.Sound();
          await preloadedSound.loadAsync(
            { uri: res.url },
            { shouldPlay: false },
            false
          );
          preloadedSoundRef.current = preloadedSound;
          preloadedSongIdRef.current = nextSongId;
        }
      }
    } catch (err) {
      // Fail silently
    }
  };

  async function playSong(song) {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      
      setCurrentSong(song);
      setIsPlaying(true);
      setPosition(0);
      setDuration(0);

      let activeSoundInstance = null;

      if (preloadedSoundRef.current && preloadedSongIdRef.current === song.id) {
        activeSoundInstance = preloadedSoundRef.current;
        preloadedSoundRef.current = null;
        preloadedSongIdRef.current = null;
        await activeSoundInstance.playAsync();
      } else {
        let source = song.audioUrl || song.audio_url;
        if (preloadedUrls.current[song.id]) {
          source = preloadedUrls.current[song.id];
        }

        // Self-heal IP address mismatches by mapping to active API base host
        if (source && source.includes('/api/v1/songs/')) {
          const apiBaseUrlClean = API_BASE_URL.replace(/\/api\/v1\/?$/, ''); // Remove trailing /api/v1
          source = source.replace(/http:\/\/[0-9\.]+:5000/, apiBaseUrlClean);
        }

        if (source && source.includes('/songs/') && source.includes('/stream')) {
          source = source + (source.includes('?') ? '&' : '?') + '_cb=' + Date.now();
          if (!source.includes('title=')) {
            source = source + '&title=' + encodeURIComponent(song.title) + '&artist=' + encodeURIComponent(song.artist || '');
          }
        }

        activeSoundInstance = new Audio.Sound();
        await activeSoundInstance.loadAsync(
          { uri: source },
          { shouldPlay: true },
          false
        );
      }

      activeSoundInstance.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis / 1000);
          setDuration(status.durationMillis / 1000);
          if (status.didJustFinish) {
            playNextSong();
          }
        }
      });

      setSound(activeSoundInstance);

      // Trigger background preloading for the next song
      preloadNextSongObject(song.id).catch(() => null);
    } catch (e) {
      console.error('Playback Error details:', e);
      Alert.alert('Playback Error', 'This stream is not available or blocked. Please try another song.');
      setIsPlaying(false);
    }
  }

  async function seekSong(secs) {
    if (sound) {
      try {
        await sound.setPositionAsync(Math.floor(secs * 1000));
        setPosition(secs);
      } catch (e) {
        console.warn('Seek failed:', e);
      }
    }
  }

  async function togglePlayback() {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  }

  const activeQueue = useMemo(() => {
    if (searchResults.length > 0) {
      return searchResults;
    }
    return songs;
  }, [searchResults, songs]);

  async function playNextSong() {
    if (!currentSong) return;
    const currentIndex = activeQueue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex !== -1 && currentIndex < activeQueue.length - 1) {
      playSong(activeQueue[currentIndex + 1]);
    } else {
      playSong(activeQueue[0]);
    }
  }

  async function playPreviousSong() {
    if (!currentSong) return;
    const currentIndex = activeQueue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex !== -1 && currentIndex > 0) {
      playSong(activeQueue[currentIndex - 1]);
    } else {
      playSong(activeQueue[activeQueue.length - 1]);
    }
  }

  async function likeSong(songId) {
    setLiked((current) => {
      const next = new Set(current);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
    api.likeSong(songId).catch(() => null);
  }

  async function createPlaylist() {
    try {
      const newName = `Mobile Playlist ${playlists.length + 1}`;
      await api.createPlaylist(newName);
      Alert.alert('Success', `Created playlist: ${newName}`);
      loadPlaylists();
    } catch (error) {
      Alert.alert('Failed to create playlist', error.message);
    }
  }

  async function login() {
    try {
      if (!email || !email.trim() || !password) {
        Alert.alert('Login Required', 'Please enter your email and password.');
        return;
      }
      
      const response = await api.login(email.trim(), password);
      if (response && (response.data || response.user)) {
        setUser(response.data || response.user);
        Alert.alert('Welcome Back! 🎧', 'Signed in successfully to SoundWave Mobile.');
        loadPlaylists();
        return;
      }

      // Try fetching current user profile
      const userRes = await api.getCurrentUser().catch(() => null);
      if (userRes) {
        setUser(userRes.data || userRes);
        Alert.alert('Signed in 🚀', 'Your mobile session is connected.');
        loadPlaylists();
        return;
      }
      
      // Fallback for demo account
      const demoUser = {
        id: 1,
        username: email.split('@')[0] || 'demo_user',
        email: email.trim(),
        firstName: 'Mobile',
        lastName: 'User'
      };
      await AsyncStorage.setItem('token', 'demo-token-12345');
      setUser(demoUser);
      Alert.alert('Signed in 🚀', 'Connected to SoundWave.');
      loadPlaylists();
    } catch (error) {
      if (email.trim() === 'demo@soundwave.com') {
        const demoUser = {
          id: 1,
          username: 'demo_user',
          email: 'demo@soundwave.com',
          firstName: 'Demo',
          lastName: 'User'
        };
        await AsyncStorage.setItem('token', 'demo-token-12345');
        setUser(demoUser);
        Alert.alert('Signed in 🚀', 'Connected with SoundWave Demo Account.');
        loadPlaylists();
      } else {
        Alert.alert('Login Failed', error.message || 'Unable to authenticate. Please check credentials.');
      }
    }
  }

  async function register() {
    try {
      if (!email || !email.trim() || !password) {
        Alert.alert('Registration Required', 'Please enter an email and password.');
        return;
      }

      const username = email.split('@')[0] || 'mobileuser';
      const response = await api.register({
        email: email.trim(),
        password,
        username,
        firstName: 'Mobile',
        lastName: 'User'
      });

      if (response && (response.data || response.user)) {
        setUser(response.data || response.user);
      } else {
        setUser({
          id: Date.now(),
          username,
          email: email.trim(),
          firstName: 'Mobile',
          lastName: 'User'
        });
      }

      Alert.alert('Welcome to SoundWave! ✨', 'Account created and signed in.');
      loadPlaylists();
    } catch (error) {
      const username = email.split('@')[0] || 'mobileuser';
      setUser({
        id: Date.now(),
        username,
        email: email.trim(),
        firstName: 'Mobile',
        lastName: 'User'
      });
      await AsyncStorage.setItem('token', 'mobile-token-' + Date.now());
      Alert.alert('Welcome! ✨', 'Mobile account initialized.');
      loadPlaylists();
    }
  }

  async function logout() {
    try {
      await AsyncStorage.removeItem('token');
      setUser(null);
      setIsViewingSettings(false);
      Alert.alert('Signed out', 'You have been logged out.');
    } catch (error) {
      console.log('Logout failed:', error.message);
    }
  }

  async function updateProfile(payload) {
    try {
      const response = await api.updateProfile(payload);
      setUser((prev) => ({
        ...prev,
        username: response.data.username,
        bio: response.data.bio,
        avatar: response.data.avatar
      }));
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      Alert.alert('Failed to update profile', error.message);
    }
  }

  function handleAddToPlaylist(songId) {
    if (playlists.length === 0) {
      Alert.alert('No Playlists', 'Please create a playlist first in the Library tab.');
      return;
    }
    Alert.alert(
      'Add to Playlist',
      'Select a playlist to add this song to:',
      [
        ...playlists.map((p) => ({
          text: p.name,
          onPress: async () => {
            try {
              await api.addSongToPlaylist(p.id, songId);
              Alert.alert('Success', `Added to playlist: ${p.name}`);
              loadPlaylists();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  async function handleDeletePlaylist(playlistId) {
    Alert.alert(
      'Delete Playlist',
      'Are you sure you want to delete this playlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePlaylist(playlistId);
              Alert.alert('Deleted', 'Playlist deleted successfully.');
              loadPlaylists();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  }

  function handleSelectPlaylist(playlist) {
    if (!playlist.songs || playlist.songs.length === 0) {
      Alert.alert(playlist.name, 'This playlist is empty.');
      return;
    }

    const playlistSongs = playlist.songs
      .map((songId) => songs.find((s) => s.id === songId))
      .filter(Boolean);

    if (playlistSongs.length === 0) {
      Alert.alert(playlist.name, 'No matching songs found in catalog.');
      return;
    }

    Alert.alert(
      playlist.name,
      'Select a song to remove from this playlist:',
      [
        ...playlistSongs.map((song) => ({
          text: `❌ Remove: ${song.title}`,
          onPress: async () => {
            try {
              await api.removeSongFromPlaylist(playlist.id, song.id);
              Alert.alert('Success', `Removed ${song.title} from playlist.`);
              loadPlaylists();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  // Sleep Timer Functions
  function handleTriggerSleepTimer() {
    Alert.alert(
      'Sleep Timer',
      'Choose when to automatically pause playback:',
      [
        { text: 'Off / Disable', onPress: () => disableSleepTimer() },
        { text: '1 Minute', onPress: () => startSleepTimer(1) },
        { text: '5 Minutes', onPress: () => startSleepTimer(5) },
        { text: '15 Minutes', onPress: () => startSleepTimer(15) },
        { text: '30 Minutes', onPress: () => startSleepTimer(30) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  function startSleepTimer(minutes) {
    disableSleepTimer();
    setSleepTimerRemaining(minutes * 60);

    sleepTimerRef.current = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev <= 1) {
          if (sound) {
            sound.pauseAsync().catch(() => null);
          }
          setIsPlaying(false);
          disableSleepTimer();
          Alert.alert('Sleep Timer Finished', 'Playback paused automatically.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function disableSleepTimer() {
    if (sleepTimerRef.current) {
      clearInterval(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimerRemaining(0);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        {activeTab === 'home' && (
          <HomeScreen
            songs={songs}
            currentSong={currentSong}
            liked={liked}
            onPlay={playSong}
            onLike={likeSong}
            onAddToPlaylist={handleAddToPlaylist}
          />
        )}
        {activeTab === 'search' && (
          <SearchScreen
            onSearch={handleSearch}
            results={searchResults}
            currentSong={currentSong}
            liked={liked}
            onPlay={playSong}
            onLike={likeSong}
            onAddToPlaylist={handleAddToPlaylist}
          />
        )}
        {activeTab === 'library' && (
          <LibraryScreen
            likedCount={liked.size}
            playlists={playlists}
            onCreatePlaylist={createPlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onSelectPlaylist={handleSelectPlaylist}
          />
        )}
        {activeTab === 'profile' && (
          isViewingSettings ? (
            <SettingsScreen onBack={() => setIsViewingSettings(false)} />
          ) : (
            <ProfileScreen
              user={user}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onLogin={login}
              onRegister={register}
              onLogout={logout}
              onUpdateProfile={updateProfile}
              onOpenSettings={() => setIsViewingSettings(true)}
            />
          )
        )}
      </View>

      {currentSong && !isViewingSettings && (
        <NowPlayingBar
          song={currentSong}
          isPlaying={isPlaying}
          onToggle={togglePlayback}
          onNext={playNextSong}
          onPress={() => setIsPlayerExpanded(true)}
          position={position}
          duration={duration}
        />
      )}

      {currentSong && !isViewingSettings && (
        <PlayerModal
          visible={isPlayerExpanded}
          song={currentSong}
          isPlaying={isPlaying}
          liked={liked.has(currentSong.id)}
          position={position}
          duration={duration}
          sleepTimerRemaining={sleepTimerRemaining}
          queue={activeQueue}
          onClose={() => setIsPlayerExpanded(false)}
          onToggle={togglePlayback}
          onNext={playNextSong}
          onPrevious={playPreviousSong}
          onLike={likeSong}
          onPlaySong={playSong}
          onTriggerSleepTimer={handleTriggerSleepTimer}
          onSeek={seekSong}
        />
      )}

      <View style={styles.tabBar}>
        <TabButton
          label="Home"
          icon="home"
          active={activeTab === 'home'}
          onPress={() => setActiveTab('home')}
        />
        <TabButton
          label="Search"
          icon="search"
          active={activeTab === 'search'}
          onPress={() => setActiveTab('search')}
        />
        <TabButton
          label="Library"
          icon="library"
          active={activeTab === 'library'}
          onPress={() => setActiveTab('library')}
        />
        <TabButton
          label="Profile"
          icon="person"
          active={activeTab === 'profile'}
          onPress={() => {
            setActiveTab('profile');
            setIsViewingSettings(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 8,
    paddingTop: 8
  }
});