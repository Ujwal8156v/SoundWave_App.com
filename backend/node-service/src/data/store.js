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
    genre: 'Punjabi',
    coverArt: 'https://img.youtube.com/vi/N9sCJ04s29s/hqdefault.jpg',
    source: 'free-demo',
    plays: 50000,
    rating: 4.8,
    audioUrl: 'http://192.168.29.19:5000/api/v1/songs/yt-N9sCJ04s29s/stream'
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