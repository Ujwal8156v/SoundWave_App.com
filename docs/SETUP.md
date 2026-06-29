# SoundWave Setup Guide

## Prerequisites

### Required
- Node.js v16 or higher
- npm v8 or higher
- PostgreSQL 12+
- Redis 6+
- Python 3.9+
- Git

### Optional (for API integrations)
- Spotify Developer Account
- YouTube API Key
- Last.fm API Key
- AWS Account (S3)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/Ujwal8156v/soundwave-musicstream-app.git
cd soundwave-musicstream-app
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/soundwave

# Redis
REDIS_URL=redis://localhost:6379

# API Keys (optional)
SPOTIFY_CLIENT_ID=your_key
YOUTUBE_API_KEY=your_key
```

### 3. Database Setup

#### Create PostgreSQL Database

```bash
# Using psql
psql -U postgres

# Create database
CREATE DATABASE soundwave;
CREATE DATABASE soundwave_test;

# Create user (optional)
CREATE USER soundwave_user WITH PASSWORD 'password';
ALTER ROLE soundwave_user SET client_encoding TO 'utf8';
ALTER ROLE soundwave_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE soundwave_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE soundwave TO soundwave_user;
```

#### Run Migrations

```bash
cd backend/node-service
npm run migrate
npm run seed  # Optional: seed sample data
```

### 4. Redis Setup

#### Using Docker (Recommended)

```bash
docker run -d \
  --name soundwave-redis \
  -p 6379:6379 \
  redis:latest
```

#### Local Installation

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt-get install redis-server
sudo systemctl start redis-server

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

### 5. Backend Setup

#### Node.js Service

```bash
cd backend/node-service

# Install dependencies
npm install

# Run development server
npm run dev

# Server runs on http://localhost:5000
```

#### Python Service

```bash
cd backend/python-service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python main.py

# Server runs on http://localhost:8000
```

### 6. Frontend Setup

#### Web Frontend

```bash
cd web-frontend

# Install dependencies (if using build tools)
npm install

# Start development server
npm run dev

# Runs on http://localhost:3000
```

#### Mobile App

```bash
cd mobile-app

# Install dependencies
npm install

# Start app
npm start

# For iOS
npm run ios

# For Android
npm run android
```

## Docker Setup (Alternative)

### Using Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- Web: http://localhost:3000
- API: http://localhost:5000
- Python: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Development Commands

### Running All Services

```bash
# From root directory
npm run dev

# Or individually
npm run dev:web
npm run dev:backend
npm run dev:mobile
```

### Testing

```bash
# Run all tests
npm test

# Run specific tests
npm run test:backend
npm run test:web
npm run test:mobile

# With coverage
npm run test:backend -- --coverage
```

### Linting & Formatting

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## API Integration Setup

### Spotify

1. Go to https://developer.spotify.com/dashboard
2. Create an application
3. Copy Client ID and Secret
4. Add to `.env`:

```
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
SPOTIFY_REDIRECT_URI=http://localhost:5000/api/v1/auth/spotify/callback
```

### YouTube

1. Go to https://console.cloud.google.com
2. Create project and enable YouTube Data API v3
3. Create API key
4. Add to `.env`:

```
YOUTUBE_API_KEY=your_key
```

## Troubleshooting

### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. Review [API Documentation](./API.md)
2. Check [Architecture](./ARCHITECTURE.md)
3. Explore code in relevant directories
4. Start contributing!

## Need Help?

- Check [Issues](https://github.com/Ujwal8156v/soundwave-musicstream-app/issues)
- Read [Documentation](./)
- Create a new issue
