# Stickman Video Engine

**Visual identity: Style C, stylized 3D stickman (permanent).** Read [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) before changing characters, lighting, sets or cameras, and re-run `npm run benchmark` afterwards. Reference images are in [docs/benchmark/](docs/benchmark/).

A niche-independent production engine for stickman videos. Its only fixed rule is the **stickman visual identity**. Category, topic, tone, language, duration, format and palette are per-video data.

```
Storyboard (director)  ──adapter──▶  VideoSpec (scene data)  ──▶  Three.js rig + Remotion timeline  ──▶  MP4  ──▶  QC
 written with the            adapters/            schema/scene.ts       three/  animations/  remotion/        renders/   sve qc
 directing-stickman-videos   storyboardToSpec.ts
 Skill's narrative rules
```

| Layer | Owns | Files |
|---|---|---|
| Director | Story, shots, beats, cast, blocking, camera intent | `director/storyboard.ts`, `projects/<id>/storyboard.json` |
| Adapter | Retiming to the target duration, beats → action tracks, film-language camera → keyframes, audio paths | `adapters/storyboardToSpec.ts` |
| Scene data | One validated JSON contract (zod) | `schema/scene.ts` |
| Characters | Style C rig: connected tapered body, expressive face, hand shapes; locked proportions | `characters/library.json`, `three/Stickman.tsx`, `three/skeleton.ts` (FK/IK/ground contact) |
| Animation | 30 deterministic actions with weighted gaits, momentum, anticipation and IK `reach` | `animations/library.ts` |
| 3D | Layered environments, three-point soft-shadow lighting, contact shadows, reusable assets | `three/environments.tsx`, `three/assets.tsx`, `three/props.tsx` |
| Timeline | Scenes, transitions, captions, overlays, narration/SFX/music sync, encoding | `remotion/` |
| Audio (optional) | espeak-ng narration plus CC0/CC-BY SFX and music from the Skill's licensed library (read-only) | `audio/index.ts` |
| CLI + QC | new / build / render / still / qc / produce | `scripts/sve.ts` |

The existing Skill (`skills/directing-stickman-videos`, modes A1–A8 and B1–B7) is **not modified**. The engine reads only its audio `catalog.json`.

## Restore in a fresh cloud session

```bash
cd engine && ./scripts/setup.sh
```

The script runs `npm ci`, installs `espeak-ng` if missing, checks the pre-installed Chromium, and runs the typecheck and unit tests. Rendering uses `/opt/pw-browsers/chromium` with `--gl=angle` (software WebGL). Override it with `REMOTION_CHROME=/path/to/chrome`. Concurrency is controlled by `REMOTION_CONCURRENCY` (default 4).

Pinned stack: remotion / @remotion/{cli,renderer,three,transitions} 4.0.300, react 18.3.1, three 0.170.0, @react-three/fiber 8.17.10, zod 3.23.8, TypeScript 5.6, tsx 4.19.

## Production workflow

```bash
npm run new -- my-video --topic "..." --category "any" --duration 45 --language en --aspect 16:9
# edit projects/my-video/storyboard.json (see docs/STORYBOARD.md); Claude can author it with the Skill
npm run build -- my-video                   # TTS + SFX/music lookup + adapter -> public/projects/my-video/spec.json
npx tsx scripts/sve.ts still my-video 4.5   # review a frame before the full render
npm run render -- my-video                  # -> renders/my-video-16x9-720p.mp4
npm run qc -- my-video                      # ffprobe/frames/black/freeze checks + contact sheet
npm run produce -- my-video                 # build + render + qc
npm run render -- my-video --quality 1080p --aspect 9:16   # other formats; re-frame the camera for 9:16
npm run studio                              # Remotion Studio (interactive preview)
npm run action-sheet                        # QA contact sheet of every action -> out/action-sheet.png
npm run stills -- my-video 2.5 8 14         # fast review stills from one bundle -> out/my-video/
npm run benchmark                           # Style C visual benchmark -> out/benchmark/
npm test && npm run typecheck
```

Recommended human checkpoints: approve the storyboard after `build` (it prints retiming and narration warnings), then approve stills, then run the full render.

## Extending

- **Character:** add an entry to `characters/library.json`, or put it in the storyboard `cast`. Proportions stay locked.
- **Action:** add a name to `ACTIONS` in `schema/scene.ts` and a pure `(t, ctx) => Pose` to `ACTION_FNS`. The unit tests check that it is deterministic and finite.
- **Environment or prop:** add a preset to `three/environments.tsx` or `three/props.tsx`, built from primitives. Colours can be overridden per shot via `palette`.
- **TTS provider:** add an entry to `TTS_PROVIDERS` in `audio/index.ts`. Paid providers must stay opt-in.

## Licences

Remotion is free for individuals and companies with up to 3 employees; larger companies need a company licence (see remotion.dev/license). three.js, R3F and zod use MIT. espeak-ng uses GPL-3.0 as a separate CLI; its generated audio is not encumbered. Music and SFX keep their own licences: `npm run build` writes `projects/<id>/CREDITS.txt`, and CC-BY entries **must** go in the video description.
