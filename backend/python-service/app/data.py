from app.models import Song


SONGS = [
    Song(
        id=1,
        title="Midnight Dreams",
        artist="Luna Echo",
        album="Nocturne",
        duration=245,
        genre="Electronic",
        plays=15000,
        rating=4.5,
        mood="dreamy",
        tempo=118,
        energy=0.72,
        audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    ),
    Song(
        id=2,
        title="Summer Vibes",
        artist="Sunny Days",
        album="Tropical Paradise",
        duration=210,
        genre="Pop",
        plays=20000,
        rating=4.7,
        mood="happy",
        tempo=124,
        energy=0.86,
        audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    ),
    Song(
        id=3,
        title="Rhythm of Life",
        artist="Urban Sound",
        album="City Nights",
        duration=280,
        genre="Hip-Hop",
        plays=18000,
        rating=4.3,
        mood="focused",
        tempo=96,
        energy=0.64,
        audio_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    ),
]


def find_song(song_id: int) -> Song | None:
    return next((song for song in SONGS if song.id == song_id), None)