# Reference Analysis — "The Dark Age – Animator vs. Animation 14" (Alan Becker)

Status: **REFERENCE NOT INSPECTED. Access blocked. Preliminary report only.**
Date: 2026-11-23

---

## 0. Access verification (Phase 1 gate)

| Check | Result |
|---|---|
| `https://www.youtube.com/watch?v=QCZjNqtnGmM` | **Blocked.** The environment's network proxy refuses the tunnel (`CONNECT tunnel failed, response 403`); no page was received |
| YouTube video CDN (`*.googlevideo.com`) | **Blocked** (same 403) |
| Video, frames, audio, captions or credits received | **None** |
| Metadata (title, length, description, credits) | **Not retrieved;** the same host is blocked |

Consequences:

- **No shot was watched.** Sections A–E below contain **no timestamps, shot descriptions or audio observations.** Leaving them empty is deliberate: anything written there would be invented.
- I did not try to circumvent the block (for example by adding YouTube to the allowlist and scraping with a downloader). That route may conflict with the platform's terms, and the brief asks for the file to be supplied instead.

### What is needed to complete the forensic analysis

One of the following, placed in `engine/reference/` (git-ignored, not redistributed):

1. The reference **MP4** (any resolution ≥ 720p, with its audio track), **or**
2. An **extracted frame sequence** (for example 4 fps PNG/JPG, plus 24 fps for action passages) and a separate **WAV/MP3** of the soundtrack, plus a text copy of the **end credits** for section F.

The analysis tooling is ready (`scripts/reference-analyze.sh`). It needs only ffmpeg/ffprobe and produces:

- shot boundaries (`select='gt(scene,0.3)'` with `showinfo`), giving a start, end and duration table;
- a contact sheet per shot plus 24 fps strips for fast passages;
- a loudness and onset profile (`ebur128`, `silencedetect`, `astats`) for the audio section.

Every row in sections A–E will then cite the frame or timestamp it came from.

---

## A. Scene and shot breakdown

**Not available.** It requires the inspected video; see §0.

## B. Animation analysis

**Observed techniques:** none (not inspected).

**Recommendations (not observations).** The general principles we will implement regardless of the reference:

- strong anticipation before every strike;
- smear or motion-trail frames on fast limbs;
- squash on landing and stretch on launch, applied to the 2D rig;
- impact frames: a 1–2 frame flash plus a hit-stop of 2–3 frames;
- overlapping action on head and limbs;
- readable silhouettes, which means profile staging for action;
- clear contact points;
- reaction recoil proportional to force.

## C. Camera and cinematography

**Observed:** none. **Recommendations:**

- wide shots for geography before action;
- motivated tracking during chases;
- whip-pans as cuts;
- consistent screen direction for each team;
- reaction close-ups after major events;
- parallax depth to sell scale.

## D. Environment and art direction

**Observed:** none. **Recommendations:**

- foreground, midground and background layering;
- haze for depth;
- strong value separation between characters and sets (dark sets, bright characters, or the reverse);
- environment pieces that can react (break, spark, collapse).

## E. Audio analysis

**Not inspected.** No audio observations are made.

## F. Production pipeline

The credits were **not retrieved**, so no specific roles or names are claimed. The generic animated-short roles and how our automated pipeline covers each one:

| Role | Our pipeline component |
|---|---|
| Director / storyboard | `director/storyboard.ts`, `director/coverage.ts`, plus the new action director |
| Character animation | `animations/library.ts` (Style C) and the new 2D hybrid rig and choreography |
| Layout / backgrounds | `three/environments.tsx` plus new modular industrial kits |
| Effects (VFX) | New event-driven `vfx/` module |
| Compositing / camera | Remotion timeline plus the Three.js camera director |
| Sound design / music | `audio/` with the licensed library and the event-driven cue map |
| QC | `sve qc`, the safe-zone audit and frame/contact-sheet review |

---

## Proposed architecture: `HYBRID_STICKMAN_CINEMATIC` (does not touch Style C)

```
storyboard.json  (mode: "hybrid")
   │  director/storyboard.ts  (+ actionEvents[], vfx[], mode)
   ▼
adapters/storyboardToSpec.ts  (unchanged path; adds hybrid fields)
   ▼
choreography/  ── action director: validates initiator/target/distance/contact; emits
   │              per-character pose tracks, impact times, VFX cues, SFX cues, camera events
   ▼
Remotion StickmanVideo ─► SceneComp ─► mode switch
        style-c  → three/StageCanvas (existing, untouched)
        hybrid   → hybrid/HybridStage:
                     • Three.js 3D environment + camera (reuses three/environments, looks, camera)
                     • 2D stickman layer: SVG/canvas strokes drawn from the SAME skeleton solver
                       (three/skeleton.ts) projected through the 3D camera → correct position,
                       depth order, scale and parallax; 2D-specific squash/stretch + smear trails
                     • 2D VFX layer (impact flashes, speed lines) + 3D particles (sparks, dust, debris)
                     • compositing in Remotion (z-ordered layers, grade)
```

Technology decisions:

- **No new runtime libraries required.**
  - 2D characters are drawn as inline SVG paths in React, so they are deterministic and resolution-independent.
  - 3D uses the existing three.js / R3F stack.
  - VFX use procedural instanced meshes and SVG.
  - Encoding stays with ffmpeg via Remotion.
- I evaluated and declined, because no demonstrated need exists yet:
  - a physics engine (cannon/rapier): hits are choreographed, not simulated;
  - postprocessing bloom: it is costly in software WebGL, and additive sprites fake it cheaply;
  - Lottie and other 2D-animation runtimes: our rig is procedural.

## Which features can be added without breaking Style C

| Feature | Shared or isolated | Risk to Style C |
|---|---|---|
| New actions (punch, kick, dodge, block, grab, throw, pull, roll, land, climb, slide, run-stop, handshake, high-five, rescue, carry) | Shared `ACTION_FNS`, additive only | None: existing actions are untouched, and unit tests guard bone lengths and finiteness |
| Character-to-character IK (handshake, high-five, rescue) | `reach` targets resolved against another character's hand | None: opt-in per beat |
| Action director and action-event schema | New `choreography/`, new optional storyboard field | None |
| VFX system | New `vfx/`, rendered only when events exist | None |
| Industrial, lab and underground environments | New presets in the registry | None |
| Event-driven SFX map | Extends `audio/` | None |
| Hybrid 2D renderer | New `hybrid/`, selected by `mode: "hybrid"` | None: `style-c` stays the default |
