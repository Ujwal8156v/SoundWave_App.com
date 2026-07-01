from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
from app.core.logger import log_info, log_error
from datetime import datetime, timedelta

router = APIRouter()

# Mock analytics data
analytics_db = {}

@router.get("/user/{user_id}")
async def get_user_analytics(user_id: int, period: str = Query("week", regex="^(day|week|month|year)$")):
    """Get user analytics"""
    try:
        analytics = {
            'userId': user_id,
            'period': period,
            'totalListeningTime': 5000,
            'totalSongsHeard': 150,
            'totalPlaylistsCreated': 12,
            'mostPlayedGenre': 'Pop',
            'topSongs': [
                {'id': 1, 'title': 'Midnight Dreams', 'playCount': 25},
                {'id': 2, 'title': 'Summer Vibes', 'playCount': 30}
            ],
            'topArtists': [
                {'name': 'Luna Echo', 'listenCount': 45},
                {'name': 'Sunny Days', 'listenCount': 52}
            ],
            'listeningTrend': [
                {'date': '2024-01-01', 'minutes': 120},
                {'date': '2024-01-02', 'minutes': 150},
                {'date': '2024-01-03', 'minutes': 180}
            ]
        }
        
        log_info(f"Fetched analytics for user: {user_id}")
        
        return {
            'success': True,
            'data': analytics
        }
    except Exception as e:
        log_error(f"Error fetching analytics for user {user_id}", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics"
        )

@router.get("/song/{song_id}")
async def get_song_analytics(song_id: int):
    """Get song analytics"""
    try:
        analytics = {
            'songId': song_id,
            'title': 'Midnight Dreams',
            'artist': 'Luna Echo',
            'totalPlays': 15000,
            'uniqueListeners': 8500,
            'averagePlayDuration': 200,
            'skipRate': 0.15,
            'saveRate': 0.45,
            'dailyPlays': [
                {'date': '2024-01-01', 'plays': 500},
                {'date': '2024-01-02', 'plays': 550},
                {'date': '2024-01-03', 'plays': 600}
            ],
            'topCountries': [
                {'country': 'USA', 'plays': 5000},
                {'country': 'UK', 'plays': 3000},
                {'country': 'Canada', 'plays': 2000}
            ]
        }
        
        log_info(f"Fetched analytics for song: {song_id}")
        
        return {
            'success': True,
            'data': analytics
        }
    except Exception as e:
        log_error(f"Error fetching analytics for song {song_id}", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch song analytics"
        )

@router.post("/track-event")
async def track_event(event_type: str, user_id: int, song_id: int, metadata: Optional[dict] = None):
    """Track user events"""
    try:
        event = {
            'eventType': event_type,
            'userId': user_id,
            'songId': song_id,
            'metadata': metadata or {},
            'timestamp': datetime.utcnow().isoformat()
        }
        
        log_info(f"Tracked event: {event_type} for user {user_id}")
        
        return {
            'success': True,
            'message': 'Event tracked successfully',
            'data': event
        }
    except Exception as e:
        log_error("Error tracking event", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track event"
        )
