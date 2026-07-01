from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.core.logger import log_info, log_error
from datetime import datetime

router = APIRouter()

# Pydantic models
class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class PlaylistAddSong(BaseModel):
    song_id: int

# Mock playlists database
playlists_db = {}
playlist_counter = 1

@router.get("/")
async def get_playlists(user_id: int, page: int = 1, limit: int = 20):
    """Get user playlists"""
    try:
        # Mock playlists for user
        user_playlists = [
            {
                'id': 1,
                'name': 'Chill Vibes',
                'description': 'Relaxing songs for studying',
                'owner': user_id,
                'songCount': 25,
                'isPublic': False,
                'followers': 5,
                'createdAt': '2024-01-01T00:00:00Z',
                'updatedAt': '2024-01-15T00:00:00Z'
            },
            {
                'id': 2,
                'name': 'Party Mix',
                'description': 'High energy songs',
                'owner': user_id,
                'songCount': 40,
                'isPublic': True,
                'followers': 150,
                'createdAt': '2024-01-05T00:00:00Z',
                'updatedAt': '2024-01-18T00:00:00Z'
            }
        ]
        
        skip = (page - 1) * limit
        paginated = user_playlists[skip:skip + limit]
        
        log_info(f"Fetched playlists for user: {user_id}")
        
        return {
            'success': True,
            'data': paginated,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': len(user_playlists),
                'pages': (len(user_playlists) + limit - 1) // limit
            }
        }
    except Exception as e:
        log_error("Error fetching playlists", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch playlists"
        )

@router.post("/")
async def create_playlist(user_id: int, playlist: PlaylistCreate):
    """Create new playlist"""
    global playlist_counter
    
    try:
        new_playlist = {
            'id': playlist_counter,
            'name': playlist.name,
            'description': playlist.description,
            'owner': user_id,
            'songs': [],
            'isPublic': playlist.is_public,
            'followers': 0,
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        playlists_db[playlist_counter] = new_playlist
        playlist_counter += 1
        
        log_info(f"Created playlist: {playlist.name} for user {user_id}")
        
        return {
            'success': True,
            'data': new_playlist,
            'message': 'Playlist created successfully'
        }
    except Exception as e:
        log_error("Error creating playlist", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create playlist"
        )

@router.get("/{playlist_id}")
async def get_playlist(playlist_id: int):
    """Get playlist by ID"""
    try:
        playlist = playlists_db.get(playlist_id)
        
        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playlist not found"
            )
        
        log_info(f"Fetched playlist: {playlist_id}")
        
        return {
            'success': True,
            'data': playlist
        }
    except HTTPException:
        raise
    except Exception as e:
        log_error(f"Error fetching playlist {playlist_id}", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch playlist"
        )

@router.put("/{playlist_id}")
async def update_playlist(playlist_id: int, user_id: int, playlist_update: PlaylistUpdate):
    """Update playlist"""
    try:
        playlist = playlists_db.get(playlist_id)
        
        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playlist not found"
            )
        
        if playlist['owner'] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this playlist"
            )
        
        # Update fields
        if playlist_update.name:
            playlist['name'] = playlist_update.name
        if playlist_update.description is not None:
            playlist['description'] = playlist_update.description
        if playlist_update.is_public is not None:
            playlist['isPublic'] = playlist_update.is_public
        
        playlist['updatedAt'] = datetime.utcnow().isoformat()
        
        log_info(f"Updated playlist: {playlist_id}")
        
        return {
            'success': True,
            'data': playlist,
            'message': 'Playlist updated successfully'
        }
    except HTTPException:
        raise
    except Exception as e:
        log_error(f"Error updating playlist {playlist_id}", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update playlist"
        )

@router.post("/{playlist_id}/songs")
async def add_song_to_playlist(playlist_id: int, user_id: int, song: PlaylistAddSong):
    """Add song to playlist"""
    try:
        playlist = playlists_db.get(playlist_id)
        
        if not playlist:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Playlist not found"
            )
        
        if playlist['owner'] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not own this playlist"
            )
        
        if song.song_id not in playlist['songs']:
            playlist['songs'].append(song.song_id)
        
        playlist['updatedAt'] = datetime.utcnow().isoformat()
        
        log_info(f"Added song {song.song_id} to playlist {playlist_id}")
        
        return {
            'success': True,
            'data': playlist,
            'message': 'Song added to playlist'
        }
    except HTTPException:
        raise
    except Exception as e:
        log_error(f"Error adding song to playlist {playlist_id}", exc=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add song to playlist"
        )
