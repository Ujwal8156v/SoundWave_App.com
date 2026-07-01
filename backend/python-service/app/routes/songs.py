from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional
from app.core.logger import log_info, log_error
from datetime import datetime

router = APIRouter()

# Mock songs database
songs_db = [
    {
        'id': 1,
        'title': 'Midnight Dreams',
        'artist': 'Luna Echo',
        'album': 'Nocturne',
        'duration': 245,
        'genre': 'Electronic',
        'year': 2023,
        'plays': 15000,
        'rating': 4.5,
        'lyrics': 'Dancing in the night, stars shining bright...',
        'energy': 0.7,
        'danceability': 0.8,
        'tempo': 120
    },
    {
        'id': 2,
        'title': 'Summer Vibes',
        'artist': 'Sunny Days',
        'album': 'Tropical Paradise',
        'duration': 210,
        'genre': 'Pop',
        'year': 2024,
        'plays': 20000,
        'rating': 4.7,
        'lyrics': 'Feel the sun on your skin, let the music begin...',
        'energy': 0.9,
        'danceability': 0.85,
        'tempo': 128
    },
    {
        'id': 3,
        'title': 'Rhythm of Life',
        'artist': 'Urban Sound',
        'album': 'City Nights',
        'duration': 280,
        'genre': 'Hip-Hop',
        'year': 2023,
        'plays': 18000,
        'rating': 4.3,
        'lyrics': 'Life is a rhythm, gotta find your beat...',
        'energy': 0.8,
        'danceability': 0.75,
        'tempo': 95
    }
]

@router.get("/")
async def get_songs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    genre: Optional[str] = None,
    sort_by: Optional[str] = Query("rating", regex="^(rating|plays|year)$")
):
    """Get all songs with filtering and pagination"""
    try:
        filtered_songs = songs_db.copy()
        
        # Search filter
        if search:
            search_lower = search.lower()
            filtered_songs = [
                s for s in filtered_songs
                if search_lower in s['title'].lower() or
                   search_lower in s['artist'].lower() or
                   search_lower in s['album'].lower()
            ]
        
        # Genre filter
        if genre:
            filtered_songs = [
                s for s in filtered_songs
                if s['genre'].lower() == genre.lower()
            ]
        
        # Sorting
        if sort_by == 'plays':
            filtered_songs.sort(key=lambda x: x['plays'], reverse=True)
        elif sort_by == 'year':
            filtered_songs.sort(key=lambda x: x['year'], reverse=True)
        else:  # rating
            filtered_songs.sort(key=lambda x: x['rating'], reverse=True)
        
        # Pagination
        skip = (page - 1) * limit
        paginated_songs = filtered_songs[skip:skip + limit]
        
        log_info(f"Fetched songs: page={page}, limit={limit}")
        
        return {
            'success': True,
            'data': paginated_songs,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': len(filtered_songs),
                'pages': (len(filtered_songs) + limit - 1) // limit
            }
        }
    except Exception as e:
        log_error("Error fetching songs", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch songs"
        )

@router.get("/{song_id}")
async def get_song(song_id: int):
    """Get song by ID"""
    try:
        song = next((s for s in songs_db if s['id'] == song_id), None)
        
        if not song:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Song not found"
            )
        
        log_info(f"Fetched song: {song_id}")
        
        return {
            'success': True,
            'data': song
        }
    except HTTPException:
        raise
    except Exception as e:
        log_error(f"Error fetching song {song_id}", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch song"
        )

@router.get("/{song_id}/lyrics")
async def get_lyrics(song_id: int):
    """Get song lyrics"""
    try:
        song = next((s for s in songs_db if s['id'] == song_id), None)
        
        if not song:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Song not found"
            )
        
        log_info(f"Fetched lyrics for song: {song_id}")
        
        return {
            'success': True,
            'data': {
                'songId': song_id,
                'title': song['title'],
                'artist': song['artist'],
                'lyrics': song['lyrics']
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        log_error(f"Error fetching lyrics for song {song_id}", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch lyrics"
        )

@router.get("/{song_id}/features")
async def get_audio_features(song_id: int):
    """Get audio features for song"""
    try:
        song = next((s for s in songs_db if s['id'] == song_id), None)
        
        if not song:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Song not found"
            )
        
        log_info(f"Fetched audio features for song: {song_id}")
        
        return {
            'success': True,
            'data': {
                'songId': song_id,
                'title': song['title'],
                'artist': song['artist'],
                'features': {
                    'energy': song['energy'],
                    'danceability': song['danceability'],
                    'tempo': song['tempo']
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        log_error(f"Error fetching audio features for song {song_id}", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch audio features"
        )
