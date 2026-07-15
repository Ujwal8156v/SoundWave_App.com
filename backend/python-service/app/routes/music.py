from fastapi import APIRouter, HTTPException, Query

from app.data import SONGS, find_song
from app.models import AnalyzeRequest, DownloadPrepareRequest

router = APIRouter()


@router.get("/catalog")
def catalog(genre: str | None = None, limit: int = Query(default=20, ge=1, le=100)):
    songs = SONGS
    if genre:
        songs = [song for song in songs if song.genre.lower() == genre.lower()]
    return {"success": True, "data": [song.model_dump() for song in songs[:limit]]}


@router.get("/search")
def search(q: str = Query(min_length=1), limit: int = Query(default=10, ge=1, le=50)):
    query = q.lower()
    matches = [
        song
        for song in SONGS
        if query in song.title.lower()
        or query in song.artist.lower()
        or query in song.album.lower()
        or query in song.genre.lower()
        or query in song.mood.lower()
    ]
    return {"success": True, "query": q, "data": [song.model_dump() for song in matches[:limit]]}


@router.get("/recommendations")
def recommendations(
    seed_song_id: int | None = None,
    genre: str | None = None,
    mood: str | None = None,
    limit: int = Query(default=10, ge=1, le=50),
):
    candidates = SONGS
    seed = find_song(seed_song_id) if seed_song_id else None

    if seed:
        candidates = [song for song in SONGS if song.id != seed.id]
        candidates.sort(
            key=lambda song: (
                song.genre != seed.genre,
                abs(song.tempo - seed.tempo),
                abs(song.energy - seed.energy),
                -song.rating,
            )
        )
    elif genre:
        candidates = [song for song in SONGS if song.genre.lower() == genre.lower()]
    elif mood:
        candidates = [song for song in SONGS if song.mood.lower() == mood.lower()]
    else:
        candidates = sorted(SONGS, key=lambda song: (song.rating, song.plays), reverse=True)

    return {"success": True, "data": [song.model_dump() for song in candidates[:limit]]}


@router.get("/songs/{song_id}/metadata")
def song_metadata(song_id: int):
    song = find_song(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    return {
        "success": True,
        "data": {
            **song.model_dump(),
            "tags": [song.genre.lower(), song.mood, f"{song.tempo}bpm"],
            "streamable": True,
            "downloadable": True,
        },
    }


@router.post("/analyze")
def analyze_track(payload: AnalyzeRequest):
    title_score = sum(ord(char) for char in payload.title.lower())
    genre = (payload.genre or "pop").lower()
    tempo = 84 + (title_score % 64)
    energy = min(0.95, max(0.25, (tempo - 70) / 90))

    mood_by_genre = {
        "electronic": "dreamy",
        "pop": "happy",
        "hip-hop": "focused",
        "rock": "energetic",
        "classical": "calm",
    }

    return {
        "success": True,
        "data": {
            "title": payload.title,
            "artist": payload.artist,
            "genre": payload.genre or "Pop",
            "duration": payload.duration,