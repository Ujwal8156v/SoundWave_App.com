# Database Schema

## PostgreSQL Tables

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### Songs Table
```sql
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist_id INTEGER REFERENCES artists(id),
  album_id INTEGER REFERENCES albums(id),
  duration INTEGER, -- seconds
  genre VARCHAR(50),
  release_date DATE,
  cover_art_url TEXT,
  source VARCHAR(50), -- 'spotify', 'youtube', 'soundcloud', etc.
  source_id VARCHAR(255), -- external service ID
  plays_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  is_explicit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_songs_artist ON songs(artist_id);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_source ON songs(source, source_id);
```

### Artists Table
```sql
CREATE TABLE artists (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  image_url TEXT,
  followers_count INTEGER DEFAULT 0,
  source VARCHAR(50),
  source_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_artists_name ON artists(name);
```

### Albums Table
```sql
CREATE TABLE albums (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  artist_id INTEGER REFERENCES artists(id),
  release_date DATE,
  cover_art_url TEXT,
  total_tracks INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_albums_artist ON albums(artist_id);
```

### Playlists Table
```sql
CREATE TABLE playlists (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_playlists_owner ON playlists(owner_id);
```

### Playlist Songs Table
```sql
CREATE TABLE playlist_songs (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(playlist_id, song_id)
);

CREATE INDEX idx_playlist_songs_playlist ON playlist_songs(playlist_id);
```

### Likes Table
```sql
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, song_id)
);

CREATE INDEX idx_likes_user ON likes(user_id);
```

### Downloads Table
```sql
CREATE TABLE downloads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id),
  quality VARCHAR(10), -- '128', '192', '256', '320'
  file_path TEXT,
  file_size INTEGER,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_downloads_user ON downloads(user_id);
```

### Comments Table
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_song ON comments(song_id);
CREATE INDEX idx_comments_user ON comments(user_id);
```

### Follows Table
```sql
CREATE TABLE follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
```

### Listening History Table
```sql
CREATE TABLE listening_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id),
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_played INTEGER -- seconds
);

CREATE INDEX idx_listening_history_user ON listening_history(user_id);
CREATE INDEX idx_listening_history_date ON listening_history(played_at);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES users(id),
  type VARCHAR(50), -- 'follow', 'comment', 'share', etc.
  content_id INTEGER,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

## Relationships Diagram

```
users
├── playlists (1:N)
├── likes (1:N)
├── comments (1:N)
├── downloads (1:N)
├── listening_history (1:N)
├── follows (follower_id, following_id) (N:N)
└── notifications (1:N)

songs
├── artist (N:1)
├── album (N:1)
├── comments (1:N)
├── likes (1:N)
├── playlist_songs (1:N)
├── downloads (1:N)
└── listening_history (1:N)

playlists
├── owner (N:1 user)
└── playlist_songs (1:N)

artists
└── songs (1:N)

albums
├── artist (N:1)
└── songs (1:N)
```

## Redis Keys

```
# User sessions
user_session:{userId} -> JWT token data

# Caching
song:{songId} -> Song object
playlist:{playlistId} -> Playlist object
artist:{artistId} -> Artist object

# Trending
trending_songs:{period} -> List of trending songs
trending_artists:{period} -> List of trending artists

# User data
user_likes:{userId} -> Set of liked song IDs
user_playlists:{userId} -> List of playlist IDs
user_followers:{userId} -> Set of follower user IDs
user_following:{userId} -> Set of following user IDs

# Real-time
active_listeners:{songId} -> Number of current listeners
notifications:{userId} -> Queue of pending notifications
```
