import hashlib
import math
import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.models.schemas import EvidenceReference
from app.storage.audit_ledger import audit_ledger


class AudioEngine:
    """
    Audio Call Recording & Speech Intelligence Engine (Version 2.0):
    Processes audio recordings of intercepted telecommunications,
    synthesizes waveforms, performs acoustic keyword spotting,
    and grounds dialog turns to Section 63 BSA 2023 evidence chains.
    """

    KEYWORD_SEVERITY = {
        "consignment": 0.95,
        "delivery": 0.90,
        "drop-off": 0.92,
        "cache": 0.88,
        "covert": 0.85,
        "destroy sim": 0.98,
        "burner": 0.92,
        "police patrol": 0.80,
        "hawala": 0.95,
        "courier": 0.78,
        "payment": 0.75,
        "synchronize": 0.82,
        "rendezvous": 0.85,
        "interdiction": 0.90
    }

    def __init__(self):
        self.audio_records: Dict[str, Dict[str, Any]] = {}
        self._init_sample_intercepts()

    def _init_sample_intercepts(self):
        """Pre-seeds gold-standard intercepted audio recordings for the syndicate demonstration."""
        sample_audio = [
            {
                "audio_id": "AUDIO_REC_KRISH_AFNAN_091",
                "caller": "Krish (9822011122)",
                "receiver": "Afnan (9822033344)",
                "timestamp": "2024-03-14T10:15:00Z",
                "duration_sec": 34,
                "tower_id": "TOWER_AUR_DEOGIRI_01",
                "dialogue": [
                    {"speaker": "Krish", "time": "00:03", "text": "Afnan, are the consignment materials ready for delivery at the Deogiri perimeter?"},
                    {"speaker": "Afnan", "time": "00:14", "text": "Yes, dispatching the vehicle now. Keep your burner phone on silent. Do not miss the drop-off."},
                    {"speaker": "Krish", "time": "00:26", "text": "Understood. The college campus area is clear. Payment courier is confirmed."}
                ],
                "flagged_keywords": ["consignment", "delivery", "drop-off", "burner", "payment"],
                "acoustic_risk_score": 0.92,
                "speech_urgency": "HIGH",
                "doc_sha256": "4b68e913a8903cde89f1a2389bf4e284091ab7634d98e1a84f378291fbc98210"
            },
            {
                "audio_id": "AUDIO_REC_AFNAN_MANISH_092",
                "caller": "Afnan (9822033344)",
                "receiver": "Manish (9822022233)",
                "timestamp": "2024-03-14T11:30:00Z",
                "duration_sec": 42,
                "tower_id": "TOWER_AUR_CIDCO_02",
                "dialogue": [
                    {"speaker": "Afnan", "time": "00:05", "text": "Manish, secondary consignment package is routed to the transit point near MGM."},
                    {"speaker": "Manish", "time": "00:19", "text": "Got it. I'm scouting the campus gate right now. Need the Hawala verification code."},
                    {"speaker": "Afnan", "time": "00:31", "text": "Code is 779-ALPHA. Destroy SIM card immediately after receiving."}
                ],
                "flagged_keywords": ["consignment", "hawala", "code", "destroy sim"],
                "acoustic_risk_score": 0.96,
                "speech_urgency": "CRITICAL",
                "doc_sha256": "8f37b129c54e01938fe729b8c19a4732109841fbcde8913a903cde89f1a2389b"
            },
            {
                "audio_id": "AUDIO_REC_KRISH_MANISH_093",
                "caller": "Krish (9822011122)",
                "receiver": "Manish (9822022233)",
                "timestamp": "2024-03-14T14:45:00Z",
                "duration_sec": 51,
                "tower_id": "TOWER_AUR_DEOGIRI_01",
                "dialogue": [
                    {"speaker": "Krish", "time": "00:08", "text": "Manish, synchronize operations. Deogiri sector is locked in for 21:00."},
                    {"speaker": "Manish", "time": "00:24", "text": "MGM sector ready as well. If police patrol increases, covert backup is staged."},
                    {"speaker": "Krish", "time": "00:40", "text": "Understood. Switching off devices until the signal."}
                ],
                "flagged_keywords": ["synchronize", "police patrol", "covert"],
                "acoustic_risk_score": 0.89,
                "speech_urgency": "HIGH",
                "doc_sha256": "19a4732109841fbcde8913a903cde89f1a2389b8f37b129c54e01938fe729b8c"
            }
        ]

        for s in sample_audio:
            s["waveform"] = self.generate_waveform(s["duration_sec"], s["acoustic_risk_score"])
            self.audio_records[s["audio_id"]] = s

    def generate_waveform(self, duration_sec: int, risk_score: float) -> List[float]:
        """Generates realistic normalized audio waveform amplitude bars (0.05 to 1.0)."""
        points = 64
        waveform = []
        random.seed(duration_sec + int(risk_score * 100))
        for i in range(points):
            t = i / points
            # Combine multi-frequency harmonics with acoustic burst spikes
            base = 0.3 * math.sin(t * math.pi * 4) + 0.2 * math.cos(t * math.pi * 8)
            noise = (random.random() - 0.5) * 0.4
            spike = 0.4 if (i % 7 == 0 and risk_score > 0.8) else 0.0
            amp = max(0.08, min(0.98, abs(base) + abs(noise) + spike))
            waveform.append(round(amp, 3))
        return waveform

    def process_audio_file(
        self,
        audio_bytes: bytes,
        filename: str,
        caller: str,
        receiver: str,
        transcript_text: str,
        officer_id: str,
        tower_id: str = "TOWER_INTERCEPT_SPECIAL"
    ) -> Dict[str, Any]:
        """
        Processes uploaded audio file, calculates SHA-256 hash, extracts keywords,
        computes risk rating, and appends to BSA 2023 audit ledger.
        """
        doc_sha256 = hashlib.sha256(audio_bytes).hexdigest()
        audio_id = f"AUDIO_{doc_sha256[:12].upper()}"

        # Keyword Spotting
        text_lower = transcript_text.lower()
        found_keywords = []
        max_severity = 0.4

        for kw, sev in self.KEYWORD_SEVERITY.items():
            if kw in text_lower:
                found_keywords.append(kw)
                if sev > max_severity:
                    max_severity = sev

        # Calculate Speech Urgency
        if max_severity >= 0.90:
            urgency = "CRITICAL"
        elif max_severity >= 0.75:
            urgency = "HIGH"
        else:
            urgency = "MEDIUM"

        duration = max(15, len(transcript_text) // 5)
        waveform = self.generate_waveform(duration, max_severity)

        record = {
            "audio_id": audio_id,
            "filename": filename,
            "caller": caller,
            "receiver": receiver,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "duration_sec": duration,
            "tower_id": tower_id,
            "transcript": transcript_text,
            "flagged_keywords": found_keywords,
            "acoustic_risk_score": round(max_severity, 2),
            "speech_urgency": urgency,
            "waveform": waveform,
            "doc_sha256": doc_sha256,
            "dialogue": [
                {"speaker": caller, "time": "00:04", "text": transcript_text}
            ]
        }

        self.audio_records[audio_id] = record

        # Register in Audit Ledger
        audit_ledger.append_entry(
            officer_id=officer_id,
            action="INGEST_AUDIO_RECORDING",
            target_id=audio_id,
            payload={
                "audio_id": audio_id,
                "filename": filename,
                "sha256": doc_sha256,
                "keywords": found_keywords,
                "risk_score": max_severity
            }
        )

        return record

    def get_audio_record(self, audio_id: str) -> Optional[Dict[str, Any]]:
        return self.audio_records.get(audio_id)

    def get_all_records(self) -> List[Dict[str, Any]]:
        return list(self.audio_records.values())


audio_engine = AudioEngine()
