"""
DEPRECATED — DO NOT REGISTER THIS ROUTER.

This file is a dead stub. The real transcription logic lives inside:
  backend/app/api/lectures.py  -> POST /api/lectures/{lecture_id}/transcribe

This file is kept to avoid breaking any git history references but must NOT
be added to app.include_router() in main.py — doing so would shadow the real
route and return empty 200 responses for all transcription calls.

If additional transcription routes are needed in future (e.g. GET transcript,
status polling), implement them here and register with a distinct prefix.
"""
