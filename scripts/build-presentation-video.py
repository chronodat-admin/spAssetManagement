#!/usr/bin/env python3
"""Build the 90-second Asset Management Hub presentation video from slides + script."""

from __future__ import annotations

import argparse
import asyncio
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import imageio_ffmpeg

REPO_ROOT = Path(__file__).resolve().parent.parent
SLIDES_DIR = REPO_ROOT / "assets" / "website" / "presentation"
OUT_DIR = REPO_ROOT / "assets" / "website" / "presentation" / "video"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# 90-second timeline from docs/presentation/90-second-video-script.md
SEGMENTS = [
    {
        "id": "welcome",
        "slide": "presentation-slide-00-welcome-ai.png",
        "text": "Welcome to Asset Management Hub.",
        "duration": 5.0,
    },
    {
        "id": "hook",
        "slide": "presentation-slide-01-hook-ai.png",
        "text": (
            "But first, let's talk about the problem. If your organization still tracks "
            "equipment in scattered spreadsheets, you already know the pain. Laptops go "
            "missing, software licenses lapse, and no one can say exactly who has what. "
            "There's a better way — one that lives right inside the tools your team uses "
            "every day."
        ),
        "duration": 12.0,
    },
    {
        "id": "intro",
        "slide": "presentation-slide-02-intro-ai.png",
        "text": (
            "So meet Asset Management Hub — a complete hardware and software asset register, "
            "built natively on SharePoint Online and Microsoft Teams. One hub. Your tenant. "
            "Your data."
        ),
        "duration": 6.0,
    },
    {
        "id": "dashboard",
        "slide": "presentation-slide-03-dashboard-ai.png",
        "text": (
            "Open the dashboard and see your entire portfolio at a glance — total assets, "
            "assignments, availability, and status charts. Register hardware and software "
            "licenses in governed SharePoint lists your IT team already trusts."
        ),
        "duration": 15.0,
    },
    {
        "id": "operations",
        "slide": "presentation-slide-04-operations-ai.png",
        "text": (
            "Assign assets to people. Process returns. Book shared equipment. "
            "Scan barcodes on mobile. Run inventory counts. Every action updates the register "
            "instantly — no manual spreadsheets."
        ),
        "duration": 15.0,
    },
    {
        "id": "governance",
        "slide": "presentation-slide-05-governance-ai.png",
        "text": (
            "Build custom reports and export to CSV. Track depreciation schedules. "
            "Review a full audit log of every change. Administrators control categories, "
            "locations, vendors, and roles from one settings hub."
        ),
        "duration": 15.0,
    },
    {
        "id": "cta",
        "slide": "presentation-slide-06-cta-ai.png",
        "text": (
            "Deploy on SharePoint pages, Teams channel tabs, personal apps, and native list forms. "
            "Employees use the same experience whether they're in the browser or inside Teams. "
            "Your data stays in your tenant. One license per site collection — no per-seat fees. "
            "Start your 14-day free trial today."
        ),
        "duration": 24.0,
    },
    {
        "id": "thankyou",
        "slide": "presentation-slide-07-thankyou-ai.png",
        "text": (
            "Thank you for watching. Asset Management Hub — hardware and software tracking "
            "for SharePoint and Teams. Get started today."
        ),
        "duration": 8.0,
    },
]

# Primary voice: Microsoft neural (edge-tts) — natural B2B narrator.
# Falls back to Windows SAPI if edge-tts/network is unavailable.
VOICE = "en-US-JennyNeural"
SAPI_FALLBACK_VOICE = "Microsoft Zira Desktop"
CROSSFADE = 0.4
WIDTH = 1920
HEIGHT = 1080
FPS = 30
LEAD_IN = 0.35   # silence before narration so words don't clip during the incoming crossfade
TAIL = 0.9       # breathing room after narration before the next slide

_EDGE_READY: bool | None = None


def edge_available() -> bool:
    """Import edge-tts and make Python trust the OS cert store (fixes proxy SSL)."""
    global _EDGE_READY
    if _EDGE_READY is not None:
        return _EDGE_READY
    try:
        import edge_tts  # noqa: F401

        try:
            import truststore

            truststore.inject_into_ssl()
        except Exception:
            pass
        _EDGE_READY = True
    except Exception:
        _EDGE_READY = False
    return _EDGE_READY


def sapi_to_wav(text: str, wav_path: Path) -> None:
    ps_text = text.replace("'", "''")
    ps_voice = SAPI_FALLBACK_VOICE.replace("'", "''")
    ps_wav = str(wav_path.resolve()).replace("'", "''")
    ps_script = (
        "Add-Type -AssemblyName System.Speech; "
        "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
        f"$s.SelectVoice('{ps_voice}'); "
        "$s.Rate = 1; "
        f"$s.SetOutputToWaveFile('{ps_wav}'); "
        f"$s.Speak('{ps_text}'); "
        "$s.Dispose()"
    )
    run(["powershell", "-NoProfile", "-Command", ps_script])


def run(cmd: list[str], *, cwd: Path | None = None) -> None:
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"Command failed ({result.returncode}): {' '.join(cmd)}\n"
            f"stdout: {result.stdout}\nstderr: {result.stderr}"
        )


async def synthesize(text: str, out_path: Path) -> None:
    if not text.strip():
        run(
            [
                FFMPEG,
                "-y",
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=44100:cl=mono",
                "-t",
                "0.1",
                "-q:a",
                "9",
                str(out_path),
            ]
        )
        return

    # Prefer the natural neural voice (edge-tts); it produces an MP3 directly.
    if edge_available():
        try:
            import edge_tts

            await edge_tts.Communicate(text, VOICE).save(str(out_path))
            return
        except Exception as exc:  # network/SSL/etc. — fall back below
            print(f"    edge-tts failed ({exc}); falling back to Windows voice")

    if sys.platform != "win32":
        raise RuntimeError(
            "Neural voice unavailable and no local fallback on this platform. "
            "Install edge-tts + truststore, or run on Windows for the SAPI fallback."
        )

    wav_path = out_path.with_suffix(".wav")
    sapi_to_wav(text, wav_path)
    run([FFMPEG, "-y", "-i", str(wav_path), "-c:a", "libmp3lame", "-q:a", "3", str(out_path)])
    wav_path.unlink(missing_ok=True)


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        [FFMPEG, "-i", str(path), "-f", "null", "-"],
        capture_output=True,
        text=True,
    )
    for line in (result.stderr or "").splitlines():
        if "Duration:" in line:
            # Duration: 00:00:15.04, start: 0.000000, bitrate: ...
            time_part = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = time_part.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError(f"Could not probe duration for {path}")


def slide_to_clip(slide_path: Path, duration: float, out_path: Path) -> None:
    run(
        [
            FFMPEG,
            "-y",
            "-loop",
            "1",
            "-i",
            str(slide_path),
            "-vf",
            (
                f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
                f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=0xF5F7FA,"
                f"fps={FPS}"
            ),
            "-t",
            f"{duration:.3f}",
            "-pix_fmt",
            "yuv420p",
            "-c:v",
            "libx264",
            str(out_path),
        ]
    )


def pad_audio_to(audio_path: Path, target_duration: float, out_path: Path) -> None:
    """Add a short lead-in and pad with trailing silence to exactly target_duration.

    Never time-stretches the voice, so the narration always plays at its natural pace.
    """
    run(
        [
            FFMPEG,
            "-y",
            "-i",
            str(audio_path),
            "-af",
            f"adelay={int(LEAD_IN * 1000)}:all=1,apad=whole_dur={target_duration:.3f}",
            "-t",
            f"{target_duration:.3f}",
            "-ac",
            "2",
            "-ar",
            "48000",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(out_path),
        ]
    )


def make_segment(clip_path: Path, audio_path: Path, out_path: Path) -> None:
    """Mux one slide clip with its (already padded) narration into a segment mp4."""
    run(
        [
            FFMPEG,
            "-y",
            "-i",
            str(clip_path),
            "-i",
            str(audio_path),
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            str(out_path),
        ]
    )


def combine_segments(segments: list[Path], durations: list[float], out_path: Path) -> None:
    """Chain per-segment mp4s with video xfade AND audio acrossfade (kept in sync)."""
    if len(segments) == 1:
        run([FFMPEG, "-y", "-i", str(segments[0]), "-c", "copy", str(out_path)])
        return

    inputs: list[str] = []
    for seg in segments:
        inputs.extend(["-i", str(seg)])

    parts: list[str] = []

    # Video: xfade at accumulating offsets.
    prev_v = "[0:v]"
    offset = durations[0] - CROSSFADE
    for i in range(1, len(segments)):
        out_label = f"[v{i}]" if i < len(segments) - 1 else "[vout]"
        parts.append(
            f"{prev_v}[{i}:v]xfade=transition=fade:duration={CROSSFADE}:offset={offset:.3f}{out_label}"
        )
        prev_v = out_label
        offset += durations[i] - CROSSFADE

    # Audio: acrossfade overlaps by the same duration, so A/V stays aligned.
    prev_a = "[0:a]"
    for i in range(1, len(segments)):
        out_label = f"[a{i}]" if i < len(segments) - 1 else "[aout]"
        parts.append(f"{prev_a}[{i}:a]acrossfade=d={CROSSFADE}:c1=tri:c2=tri{out_label}")
        prev_a = out_label

    run(
        [
            FFMPEG,
            "-y",
            *inputs,
            "-filter_complex",
            ";".join(parts),
            "-map",
            "[vout]",
            "-map",
            "[aout]",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            str(out_path),
        ]
    )


async def build(*, skip_tts: bool = False) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="amh-video-", dir=OUT_DIR))

    try:
        segment_files: list[Path] = []
        durations: list[float] = []

        for i, seg in enumerate(SEGMENTS):
            slide = SLIDES_DIR / seg["slide"]
            if not slide.exists():
                raise FileNotFoundError(f"Missing slide: {slide}")

            audio_raw = work / f"{seg['id']}.mp3"
            audio_padded = work / f"{seg['id']}-padded.aac"
            clip = work / f"{seg['id']}-video.mp4"
            segment_file = work / f"{seg['id']}.mp4"
            has_voice = bool(seg["text"].strip()) and not skip_tts

            if not has_voice:
                run(
                    [
                        FFMPEG,
                        "-y",
                        "-f",
                        "lavfi",
                        "-i",
                        "anullsrc=r=48000:cl=stereo",
                        "-t",
                        f"{seg['duration']:.3f}",
                        "-c:a",
                        "libmp3lame",
                        "-q:a",
                        "9",
                        str(audio_raw),
                    ]
                )
                seg_duration = seg["duration"]
            else:
                await synthesize(seg["text"], audio_raw)
                natural = probe_duration(audio_raw)
                # Slide lasts at least its floor, but expands to fit the natural
                # narration so the voice never has to be sped up.
                seg_duration = max(seg["duration"], natural + LEAD_IN + TAIL)

            pad_audio_to(audio_raw, seg_duration, audio_padded)
            slide_to_clip(slide, seg_duration, clip)
            make_segment(clip, audio_padded, segment_file)

            segment_files.append(segment_file)
            durations.append(seg_duration)
            print(f"  [{i + 1}/{len(SEGMENTS)}] {seg['id']}: {seg_duration:.1f}s — {seg['slide']}")

        final = OUT_DIR / "asset-management-hub-90s.mp4"
        combine_segments(segment_files, durations, final)

        total = sum(durations) - CROSSFADE * (len(durations) - 1)
        voice_used = "silent" if skip_tts else (VOICE if edge_available() else SAPI_FALLBACK_VOICE)
        print(f"\nVideo: {final}")
        print(f"Duration: ~{total:.1f}s | {WIDTH}x{HEIGHT} @ {FPS}fps | voice: {voice_used}")

        # clean intermediates on success (kept on failure for debugging)
        shutil.rmtree(work, ignore_errors=True)
        return final
    except Exception:
        print(f"Build failed; intermediates kept in {work}")
        raise


def main() -> None:
    global VOICE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-tts", action="store_true", help="Build silent video (slides only)")
    parser.add_argument(
        "--voice",
        default=VOICE,
        help="edge-tts neural voice (e.g. en-US-JennyNeural, en-US-GuyNeural, en-US-AriaNeural)",
    )
    args = parser.parse_args()
    VOICE = args.voice
    print("Building 90-second presentation video...")
    asyncio.run(build(skip_tts=args.skip_tts))


if __name__ == "__main__":
    main()
