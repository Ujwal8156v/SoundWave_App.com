# SoundWave Python Service

Fast and powerful Python backend service for music streaming, recommendations, and analytics.

## Features

- 🎵 **Song Management** - Get songs, lyrics, and audio features
- 🤖 **Smart Recommendations** - AI-powered music suggestions
- 📊 **Analytics** - User and song analytics
- 📝 **Playlists** - Create and manage playlists
- 🔐 **Authentication** - JWT-based authentication
- ⚡ **Fast** - Built with FastAPI and AsyncIO

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Setup Environment

```bash
cp .env.example .env
```

### 3. Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Access API

- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh token

### Songs
- `GET /api/v1/songs` - Get all songs
- `GET /api/v1/songs/{id}` - Get song details
- `GET /api/v1/songs/{id}/lyrics` - Get lyrics
- `GET /api/v1/songs/{id}/features` - Get audio features

### Recommendations
- `GET /api/v1/recommendations` - Get recommendations
- `GET /api/v1/recommendations/similar/{song_id}` - Similar songs
- `GET /api/v1/recommendations/trending` - Trending songs
- `GET /api/v1/recommendations/mood/{mood}` - Songs by mood

### Analytics
- `GET /api/v1/analytics/user/{user_id}` - User analytics
- `GET /api/v1/analytics/song/{song_id}` - Song analytics
- `POST /api/v1/analytics/track-event` - Track events

### Playlists
- `GET /api/v1/playlists` - Get playlists
- `POST /api/v1/playlists` - Create playlist
- `GET /api/v1/playlists/{id}` - Get playlist
- `PUT /api/v1/playlists/{id}` - Update playlist
- `POST /api/v1/playlists/{id}/songs` - Add song

## Development

```bash
# Install dev dependencies
pip install pytest pytest-asyncio pytest-cov

# Run tests
pytest

# Run with coverage
pytest --cov
```

## Environment Variables

See `.env.example` for all available configuration options.

## Technologies

- **FastAPI** - Modern web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **Redis** - Caching
- **JWT** - Authentication
- **Pydantic** - Data validation

## License

MIT
