from pydantic import BaseModel, Field


class Song(BaseModel):
    id: int
    title: str
    artist: str
    album: str
    duration: int
    genre: str
    plays: int
    rating: float
    mood: str
    tempo: int
    energy: float = Field(ge=0, le=1)
    audio_url: str


class AnalyzeRequest(BaseModel):
    title: str
    artist: str
    genre: str | None = None
    duration: int | None = Field(default=None, gt=0)


class DownloadPrepareRequest(BaseModel):
    song_id: int
    quality: str = "320"


class ApiResponse(BaseModel):
    success: bool = True
    data: object