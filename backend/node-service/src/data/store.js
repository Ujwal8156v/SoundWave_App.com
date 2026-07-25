const songs = [
  {
    id: 1,
    title: 'Midnight Dreams',
    artist: 'Luna Echo',
    album: 'Nocturne',
    duration: 245,
    genre: 'Electronic',
    coverArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80',
    source: 'free-demo',
    plays: 15000,
    rating: 4.5,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 2,
    title: 'Summer Vibes',
    artist: 'Sunny Days',
    album: 'Tropical Paradise',
    duration: 210,
    genre: 'Pop',
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    source: 'free-demo',
    plays: 20000,
    rating: 4.7,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 3,
    title: 'Rhythm of Life',
    artist: 'Urban Sound',
    album: 'City Nights',
    duration: 280,
    genre: 'Hip-Hop',
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    source: 'free-demo',
    plays: 18000,
    rating: 4.3,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
  },
  {
    id: 'yt-N9sCJ04s29s',
    title: 'Blue Eyes',
    artist: 'Yo Yo Honey Singh',
    album: 'Single',
    duration: 220,
    genre: 'Punjabi Hip-Hop',
    coverArt: 'https://img.youtube.com/vi/N9sCJ04s29s/hqdefault.jpg',
    source: 'free-demo',
    plays: 500000,
    rating: 4.9,
    audioUrl: '/api/v1/songs/yt-N9sCJ04s29s/stream'
  },
  {
    id: 'yt-v2S824L1kZ4',
    title: 'Desi Kalakaar',
    artist: 'Yo Yo Honey Singh',
    album: 'Desi Kalakaar',
    duration: 258,
    genre: 'Punjabi Hip-Hop',
    coverArt: 'https://img.youtube.com/vi/v2S824L1kZ4/hqdefault.jpg',
    source: 'free-demo',
    plays: 420000,
    rating: 4.8,
    audioUrl: '/api/v1/songs/yt-v2S824L1kZ4/stream'
  },
  {
    id: 'yt-PqFMFVcC5ac',
    title: 'Brown Rang',
    artist: 'Yo Yo Honey Singh',
    album: 'International Villager',
    duration: 179,
    genre: 'Punjabi Hip-Hop',
    coverArt: 'https://img.youtube.com/vi/PqFMFVcC5ac/hqdefault.jpg',
    source: 'free-demo',
    plays: 680000,
    rating: 4.9,
    audioUrl: '/api/v1/songs/yt-PqFMFVcC5ac/stream'
  },
  {
    id: 'yt-KhnVcAC5bIM',
    title: 'One Bottle Down',
    artist: 'Yo Yo Honey Singh',
    album: 'Single',
    duration: 195,
    genre: 'Punjabi Party',
    coverArt: 'https://img.youtube.com/vi/KhnVcAC5bIM/hqdefault.jpg',
    source: 'free-demo',
    plays: 340000,
    rating: 4.7,
    audioUrl: '/api/v1/songs/yt-KhnVcAC5bIM/stream'
  },
  {
    id: 'yt-GODSTYLE001',
    title: 'GOD STYLE',
    artist: 'Yo Yo Honey Singh',
    album: 'GLORY',
    duration: 215,
    genre: 'Urban Rap',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    source: 'free-demo',
    plays: 290000,
    rating: 4.8,
    audioUrl: '/api/v1/songs/yt-GODSTYLE001/stream'
  },
  {
    id: 'yt-BBAyRZW9b7M',
    title: 'Kesariya',
    artist: 'Arijit Singh',
    album: 'Brahmastra',
    duration: 268,
    genre: 'Bollywood Romance',
    coverArt: 'https://img.youtube.com/vi/BBAyRZW9b7M/hqdefault.jpg',
    source: 'free-demo',
    plays: 890000,
    rating: 4.9,
    audioUrl: '/api/v1/songs/yt-BBAyRZW9b7M/stream'
  }
];

const artists = [
  { id: 1, name: 'Luna Echo', followers: 50000 },
  { id: 2, name: 'Sunny Days', followers: 75000 },
  { id: 3, name: 'Urban Sound', followers: 60000 },
  { id: 4, name: 'Yo Yo Honey Singh', followers: 1000000 }
];

const findSongById = (id) => songs.find((song) => song.id === Number(id));

module.exports = {
  songs,
  artists,
  findSongById
};