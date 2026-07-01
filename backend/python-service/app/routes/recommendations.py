from fastapi import APIRouter, HTTPException, status
from typing import Optional
from app.core.logger import log_info, log_error

router = APIRouter()

# Mock recommendations engine
recommendations_db = {}

@router.get("/")
async def get_recommendations(
    user_id: Optional[int] = None,
    based_on: Optional[str] = None,
    limit: int = 10
):
    """Get personalized recommendations"""
    try:
        # Mock recommendations based on genre
        mock_recommendations = [
            {'id': 1, 'title': 'Midnight Dreams', 'artist': 'Luna Echo', 'score': 0.95},
            {'id': 2, 'title': 'Summer Vibes', 'artist': 'Sunny Days', 'score': 0.88},
            {'id': 3, 'title': 'Rhythm of Life', 'artist': 'Urban Sound', 'score': 0.82}
        ]
        
        log_info(f"Generated recommendations for user: {user_id}")
        
        return {
            'success': True,
            'data': mock_recommendations[:limit],
            'reason': 'Based on your listening history'
        }
    except Exception as e:
        log_error("Error generating recommendations", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendations"
        )

@router.get("/similar/{song_id}")
async def get_similar_songs(song_id: int, limit: int = 10):
    """Get songs similar to a given song"""
    try:
        # Mock similar songs
        similar = [
            {'id': 2, 'title': 'Summer Vibes', 'artist': 'Sunny Days', 'similarity': 0.85},
            {'id': 3, 'title': 'Rhythm of Life', 'artist': 'Urban Sound', 'similarity': 0.78}
        ]
        
        log_info(f"Fetched similar songs for: {song_id}")
        
        return {
            'success': True,
            'data': similar[:limit],
            'songId': song_id
        }
    except Exception as e:
        log_error(f"Error fetching similar songs for {song_id}", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch similar songs"
        )

@router.get("/trending")
async def get_trending_songs(limit: int = 20):
    """Get trending songs"""
    try:
        trending = [
            {'id': 2, 'title': 'Summer Vibes', 'artist': 'Sunny Days', 'trend_score': 0.95},
            {'id': 1, 'title': 'Midnight Dreams', 'artist': 'Luna Echo', 'trend_score': 0.88},
            {'id': 3, 'title': 'Rhythm of Life', 'artist': 'Urban Sound', 'trend_score': 0.82}
        ]
        
        log_info("Fetched trending songs")
        
        return {
            'success': True,
            'data': trending[:limit]
        }
    except Exception as e:
        log_error("Error fetching trending songs", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch trending songs"
        )

@router.get("/mood/{mood}")
async def get_songs_by_mood(mood: str, limit: int = 20):
    """Get songs based on mood"""
    try:
        # Mock mood-based songs
        mood_songs = {
            'happy': [{'id': 2, 'title': 'Summer Vibes', 'artist': 'Sunny Days'}],
            'sad': [{'id': 1, 'title': 'Midnight Dreams', 'artist': 'Luna Echo'}],
            'energetic': [{'id': 3, 'title': 'Rhythm of Life', 'artist': 'Urban Sound'}]
        }
        
        songs = mood_songs.get(mood.lower(), [])
        log_info(f"Fetched songs for mood: {mood}")
        
        return {
            'success': True,
            'data': songs[:limit],
            'mood': mood
        }
    except Exception as e:
        log_error(f"Error fetching songs for mood {mood}", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch songs by mood"
        )
