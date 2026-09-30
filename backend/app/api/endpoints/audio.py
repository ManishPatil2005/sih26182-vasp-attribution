from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.engines.audio_engine import audio_engine
from app.core.config import settings

router = APIRouter()


@router.get("/samples")
async def get_audio_samples():
    """
    Returns pre-loaded surveillance audio recordings for the syndicate
    (Krish, Manish, Afnan) complete with waveforms and diarized dialogue.
    """
    return audio_engine.get_all_records()


@router.get("/{audio_id}")
async def get_audio_details(audio_id: str):
    """
    Retrieves full acoustic analysis, waveform bars, and keywords for an audio intercept.
    """
    record = audio_engine.get_audio_record(audio_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Audio record '{audio_id}' not found.")
    return record


@router.post("/upload")
async def upload_audio_recording(
    file: UploadFile = File(...),
    caller: str = Form("Suspect Caller"),
    receiver: str = Form("Suspect Receiver"),
    transcript: str = Form(""),
    officer_id: str = Form(settings.DEFAULT_IO_NAME)
):
    """
    Ingests an audio recording (.wav, .mp3), generates waveform visualization,
    detects acoustic keywords, and records to the Section 63 BSA 2023 audit chain.
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty audio file provided.")

    record = audio_engine.process_audio_file(
        audio_bytes=content,
        filename=file.filename or "intercept.wav",
        caller=caller,
        receiver=receiver,
        transcript_text=transcript or f"Intercepted voice stream from {file.filename}",
        officer_id=officer_id
    )

    return {
        "success": True,
        "message": f"Successfully processed audio recording {record['audio_id']}.",
        "audio_record": record
    }
