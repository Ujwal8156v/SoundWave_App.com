# SoundWave API Documentation

## Base URL

```
Production: https://api.soundwave.app/v1
Development: http://localhost:5000/api/v1
```

## Authentication

All endpoints (except auth) require JWT token in header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Handling

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Endpoints

### Authentication

#### Register User
```
POST /auth/register

Body:
{
  "username": "username",
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

Response: 201
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username"
  },
  "token": "jwt_token"
}
```

#### Login
```
POST /auth/login

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username"
  },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

#### Refresh Token
```
POST /auth/refresh

Body:
{
  "refreshToken": "refresh_token"
}

Response: 200
{
  "success": true,
  "token": "new_jwt_token"
}
```

### Songs

#### Get All Songs
```
GET /songs?page=1&limit=20&search=artist

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)
- search: Search query
- genre: Filter by genre
- sortBy: Sort field (createdAt, popularity, rating)

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "song_id",
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "duration": 180,
      "genre": "Pop",
      "coverArt": "image_url",
      "plays": 1000,
      "rating": 4.5,
      "source": "spotify"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "pages": 50
  }
}
```

#### Get Song Details
```
GET /songs/:id

Response: 200
{
  "success": true,
  "data": {
    "id": "song_id",
    "title": "Song Title",
    "artist": {
      "id": "artist_id",
      "name": "Artist Name",
      "followers": 50000
    },
    "album": "Album Name",
    "duration": 180,
    "genre": "Pop",
    "lyrics": "Song lyrics...",
    "coverArt": "image_url",
    "plays": 1000,
    "rating": 4.5,
    "releaseDate": "2024-01-15",
    "source": "spotify"
  }
}
```

#### Stream Song
```
GET /songs/:id/stream

Response: 206 (Partial Content)
Audio file stream
```

#### Download Song
```
POST /songs/:id/download

Body:
{
  "quality": "320" // or "128", "192", "256"
}

Response: 200
{
  "success": true,
  "data": {
    "downloadUrl": "download_link",
    "expiresIn": 3600
  }
}
```

### Playlists

#### Create Playlist
```
POST /playlists

Body:
{
  "name": "My Favorites",
  "description": "My favorite songs",
  "isPublic": false
}

Response: 201
{
  "success": true,
  "data": {
    "id": "playlist_id",
    "name": "My Favorites",
    "description": "My favorite songs",
    "owner": "user_id",
    "songs": [],
    "isPublic": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Get User Playlists
```
GET /playlists

Response: 200
{
  "success": true,
  "data": [
    {
      "id": "playlist_id",
      "name": "My Favorites",
      "songCount": 25,
      "followers": 100
    }
  ]
}
```

#### Add Song to Playlist
```
POST /playlists/:playlistId/songs

Body:
{
  "songId": "song_id"
}

Response: 200
{
  "success": true,
  "message": "Song added to playlist"
}
```

### Social

#### Follow User
```
POST /social/follow/:userId

Response: 200
{
  "success": true,
  "message": "User followed"
}
```

#### Add Comment
```
POST /social/comments

Body:
{
  "songId": "song_id",
  "text": "Great song!"
}

Response: 201
{
  "success": true,
  "data": {
    "id": "comment_id",
    "author": "user_id",
    "text": "Great song!",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Share Song
```
POST /social/share

Body:
{
  "songId": "song_id",
  "platform": "twitter" // or facebook, whatsapp, email
}

Response: 200
{
  "success": true,
  "data": {
    "shareUrl": "share_link"
  }
}
```

### User Profile

#### Get Profile
```
GET /users/profile

Response: 200
{
  "success": true,
  "data": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "avatar": "avatar_url",
    "followers": 100,
    "following": 50,
    "likedSongs": 500,
    "listeningStats": {
      "totalMinutes": 5000,
      "songsHeard": 1000
    }
  }
}
```

#### Update Profile
```
PUT /users/profile

Body:
{
  "username": "newusername",
  "bio": "Music lover",
  "avatar": "avatar_url"
}

Response: 200
{
  "success": true,
  "data": { ...updated user data }
}
```

### Search

#### Global Search
```
GET /search?q=query&type=all

Query Parameters:
- q: Search query (required)
- type: Song, artist, playlist, user, all (default: all)
- limit: Results limit (default: 10)

Response: 200
{
  "success": true,
  "data": {
    "songs": [...],
    "artists": [...],
    "playlists": [...],
    "users": [...]
  }
}
```

## Rate Limiting

- 1000 requests per hour per user
- 100 requests per minute for streaming

Headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

## Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created
- `204 No Content` - Successful, no content
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing/invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server error
