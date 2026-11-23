# HYBRID_STICKMAN_CINEMATIC — architecture, usage and QC

An optional production mode alongside Style C. **Style C (`stylized_3d`) remains the default and is unchanged.** On the regression frames, the 6.0 s frame is pixel-identical; at 21.0 s, 0.04% of pixels differ, and only because of the subtler shared ambient-dust particles. Live action is **deferred**: the layer stack leaves room for a video layer later.

```
storyboard.json ─ style.characterMode: flat_2d | hybrid_2_5d | stylized_3d (per video, per shot override)
  │  shot.actions[]  ─► choreography/director.ts  (phased performances, IK contact, validation)
  │  shot.ui[] / vfx[] / sfx[] / cameraImpacts[]
  ▼  audio/foley.ts (gait footsteps, HUD cues, ambience)  →  audio stage (licensed catalog, credits)
adapters/storyboardToSpec.ts  →  director/coverage.ts (auto camera: action profile, impacts, max-hold, ECU…)
  ▼
Remotion SceneComp:  Grade( ThreeCanvas[ set · Effects3D · ghosts · characters ] ) · Effects2D · Hud · Overlays · audio
                     characters: stylized_3d → three/Stickman   |   flat_2d / hybrid_2_5d → hybrid/Stickman2D
StickmanVideo: TransitionSeries (fade/slide/wipe/brush/fire/blink) + music with ducking & pre-hit silence
```

| Priority | Component | Files | Verified by |
|---|---|---|---|
| 1 | 2D characters (unlit, outline, flat colour, 2D faces, profile-aware); same skeleton, IK and proportions | `hybrid/Stickman2D.tsx` | `p1-mode-compare.jpg`, `p1-flat2d-action-sheet.jpg` (all 49 actions), `qc-mode-compare-the-last-signal.png` |
| 2 | Action director: punch, kick, block, dodge, grab, throw, push, pull, rescue, handshake, high-five, transfer, huddle. Each goes anticipation → contact → reaction → follow-through → recovery, with auto-approach and double-booking and distance validation | `choreography/director.ts`, `ACTION_TIMING` | `p2-action-lab-contacts.jpg`, `p2-action-profile.jpg`, unit tests |
| 3 | Effects: ink burst, radial impact flash, impact frame, colour flash, sparks, dust, smoke, shockwave, debris, fire, explosion, energy, sparkle, ghost motion trails. Transitions: brush, painted fire, blink | `vfx/*` | `p3-vfx-lab.jpg` |
| 4 | HUD: news, terminal with stamp, alert, status, target lock, video call, route map, scope, binocular, fish-eye, glitch, scan wipe; safe-zone aware | `ui/Hud.tsx` | `p4-ui-lab.jpg`, `p4-ui-fixes.jpg` |
| 5 | Sound: **no narration by default**; gait footsteps; HUD cues; ambience; music ducking and pre-hit silence; semantic cue map → licensed catalog ids, credits written per project | `audio/foley.ts`, `StickmanVideo.musicDuck` | Unit tests and measured WAV/MP4 (see report) |
| 6 | Environments: industrial hall, control room, corridor, ruins, night compound (gated), hideout, built from reusable kits | `three/kits.tsx`, `three/environments.tsx` | env-lab stills |

## THE LAST SIGNAL (original 60 s test)

`projects/the-last-signal/storyboard.json`. Three original characters plus the sentinel "Ash" in FLAT_2D, across 9 shots and 4 sets, with auto coverage, 8 choreographed interactions, HUD storytelling, effects, music, SFX and ambience. No narration.

- Render: `renders/the-last-signal-16x9-720p.mp4`, 1280×720, 24 fps, 1440 frames. QC: 11/11 passed, including text safe zones.
- Reports: [`the-last-signal-report.md`](the-last-signal-report.md) (measured audio sync, pre-hit silence, licences, performance); contact sheet `the-last-signal-contact.png`.

## Run it

```bash
npm run build -- the-last-signal && npm run render -- the-last-signal && npm run qc -- the-last-signal
npx tsx scripts/reports.ts the-last-signal <render-seconds>
npm run stills -- the-last-signal 22.2 --mode stylized_3d      # compare character modes on any frame
```

Labs: `action-lab`, `vfx-lab`, `ui-lab`, `env-lab`.

## Known limitations

- **Render speed:** about 0.87 s/frame (21 min per 60 s) on a 4-core container with software WebGL.
- **Style C effects:** motion-trail ghosts exist only in the 2D modes. Style C gets the other effects but no trails.
- **Kicks:** they use FK poses without leg IK, so the foot lands near, not exactly on, the target.
- **Hand contacts:** contact points are computed at event start, so a target that moves fast mid-strike can be missed by a few centimetres.
- **Wide-shot scale:** establishing shots of large sets render characters small (by design for geography). The max-hold rule cuts in after 3.2 s.
- **Audio:** measurements come from loudness onsets with 10 ms resolution; no subjective listening was done.
- **Live action:** deferred, not implemented.
