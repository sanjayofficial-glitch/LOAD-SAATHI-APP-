"""Fish Audio free-tier TTS integration diagnostic (LoadSaathi).

Verifies the three integration requirements:
  1. Dependency  — `fish-audio-sdk` is installed and importable.
  2. Env        — `FISH_API_KEY` is present in the environment.
  3. Model       — the FREE model `s2.1-pro-free` is explicitly requested
                  (SDK default is the PAID `s2.1-pro` — never rely on it).
  4. Live check  — performs one real TTS generation and saves the audio.

Usage:
    python scripts/test_fish_audio.py

Exit codes:
    0  fully functional (audio generated & saved)
    1  configuration problem (SDK missing or FISH_API_KEY not set)
    2  live API failure (auth, quota, or network)
"""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

FREE_MODEL = "s2.1-pro-free"
SAMPLE_TEXT = "LoadSaathi Assistant audio check."
OUT_FILE = Path(tempfile.gettempdir()) / "loadsaathi_fish_check.mp3"


def fail(step: str, message: str, code: int = 1) -> int:
    print(f"[FAIL] {step}: {message}")
    return code


def main() -> int:
    # ── 1. Dependency check ──────────────────────────────────────────────
    try:
        from fishaudio import FishAudio  # official SDK (v1.4+)
    except ImportError as exc:
        return fail(
            "dependency",
            "fish-audio-sdk is not installed.\n"
            "       Install it with:  pip install -r scripts/requirements.txt\n"
            f"       (or: pip install 'fish-audio-sdk>=1.4.0') — {exc}",
        )
    print("[OK ] dependency: fish-audio-sdk importable (FishAudio class found).")

    # ── 2. Environment variable check ────────────────────────────────────
    api_key = os.environ.get("FISH_API_KEY", "").strip()
    if not api_key:
        return fail(
            "env",
            "FISH_API_KEY is not set.\n"
            "       Set it in your environment, e.g.:\n"
            "         PowerShell: $env:FISH_API_KEY = \"your_key_here\"\n"
            "         bash:       export FISH_API_KEY=your_key_here\n"
            "       Get a key at https://fish.audio → Dashboard → API Keys.",
        )
    print("[OK ] env: FISH_API_KEY is set (key length %d)." % len(api_key))

    # ── 3. Free-model parameter check ────────────────────────────────────
    # The SDK defaults to the PAID model s2.1-pro. We always pass the free
    # model explicitly so no paid-tier credits are ever touched.
    print(f"[OK ] model: explicitly requesting free tier model '{FREE_MODEL}'.")

    # ── 4. Live generation ───────────────────────────────────────────────
    client = FishAudio()
    try:
        audio = client.tts.convert(
            text=SAMPLE_TEXT,
            model=FREE_MODEL,
        )
    except Exception as exc:  # SDK raises typed errors; catch broadly for clarity
        return fail(
            "live",
            f"TTS generation failed: {type(exc).__name__}: {exc}",
            code=2,
        )

    OUT_FILE.write_bytes(audio)
    print(f"[OK ] live: generated {len(audio)} bytes of audio → {OUT_FILE}")

    print("\nFish Audio free tier integration is fully functional!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
