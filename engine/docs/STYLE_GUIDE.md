# Style C — Stylized 3D Stickman · Visual Style Guide

**Status: permanent channel identity.** Every video follows this guide unless a project explicitly requests and documents a variation, for example in `storyboard.json` → `style` or a palette override. The guide is niche-independent: it governs *how things look and move*, never *what the video is about*.

Source of truth in code: `animations/library.ts` (proportions, motion), `three/Stickman.tsx` + `three/skeleton.ts` (character), `three/environments.tsx` + `three/assets.tsx` (sets, light), `adapters/storyboardToSpec.ts` (camera lenses). Check any change with `npm run action-sheet`, `npm test` and the benchmark (below).

---

## 1. Character proportions (locked)

| Part | Value (scale 1, metres) | Note |
|---|---|---|
| Total height | ≈ 1.92 | Feet to top of head |
| Head radius | 0.20 | ≈ 21% of height. A big head carries emotion |
| Neck | 0.07 | Hidden inside the torso tube |
| Torso (pelvis → neck) | 0.56 | One tapered tube: 0.072 → 0.082 (chest) → 0.050 |
| Upper arm / forearm | 0.31 / 0.29 | Tube radius 0.050 → 0.036 |
| Thigh / shin | 0.46 / 0.45 | Tube radius 0.060 → 0.044; hip height = thigh + shin |
| Shoulder half-width | 0.16 | Arms grow out of the chest, never a separate bar |
| Hands | Mitten palm 0.05 × 0.068, plus thumb | Shapes: `relaxed open fist point thumb` |
| Feet | Rounded shoe 0.068 × 0.05 × 0.12 | Body colour × 0.7 |

Rules:
- Body parts are **connected**: limbs are smooth Catmull-Rom tubes from inside the torso through each joint, with no gaps and no floating limbs.
- Builds (`slim 0.8×`, `standard`, `sturdy 1.3×`) change thickness only. `scale` (0.6–1.4) changes overall size. Bone **lengths never change**; the unit tests enforce this for every action.
- No realistic anatomy: no fingers beyond the thumb or pointing finger, no muscles, no clothing folds.

## 2. Face

- **Head:** warm off-white `#fbf6ee` for every character, with a slight egg shape (1 : 1.04 : 0.97). It gets a thin outline in the body colour × 0.6, which links the head to its body.
- **Eyes:** white sclera ovals with a dark `#1a1a1f` pupil and one specular dot. They sit at 36% of the head radius from centre, angled to follow the sphere. They blink deterministically every ~3.6 s, with a per-character offset.
- **Brows:** rounded capsules in the body colour × 0.45. Tilt is the main emotion signal: a positive angle lifts the outer ends (determined/angry); a negative angle lifts the inner ends (sad/worried).
- **Mouth:** an ink line in one of the shapes `line smile frown wavy smirk flat`, or an open mouth (dark `#5b1f26` with a pink tongue) for talking, surprised and grin.
- **Blush:** `#ff7a8a` at 45% opacity, only for happy and excited.
- **Expression set (12):** neutral, happy, excited, sad, angry, surprised, scared, thinking, worried, determined, confused, smug. Add new ones to `FACE` in `Stickman.tsx` *and* to `EXPRESSIONS` in `schema/scene.ts`.
- **Readability:** an expression must read at 1/4 frame size in a medium shot. If it doesn't, use `close` or `extreme-close`.

## 3. Materials

| Surface | Material |
|---|---|
| Body | MeshStandard, roughness 0.42, metalness 0. Smooth with one soft highlight; no glossy clearcoat or metal |
| Head | MeshStandard, roughness 0.55, emissive 0.12 of its own colour, so faces never go muddy in shade |
| Face marks | Unlit (MeshBasic), so the face stays legible in any light |
| Sets | MeshStandard, roughness 0.7–1.0. Matte, low-poly and smooth-shaded; flat shading only for rocks and mountains |

Never use textures with real-world branding, photo textures or PBR scans.

## 4. Character colour and contrast

- Each character has **one saturated mid-value body colour** and an optional accent for its accessory. The library includes Sam `#2f6fdc` (blue, yellow scarf), Riley `#ef7a2c` (orange, navy cap), Max `#2fa463` (green, red tie), Jo `#a24fd6` (purple, pink bow), Dev `#d84545` (red, glasses) and Ash `#3d4250` (charcoal).
- Characters sharing a scene must differ in **hue and silhouette** (accessory or build).
- Sets use **lower saturation and lighter values** than the characters, so characters always pop. Do not put a character in front of a background of the same hue; override the set's `palette` instead.
- Night scenes: raise character readability with the rim light, and never darken body colours.

## 5. Lighting (three-point rig, `EnvironmentView`)

| Light | Day | Dusk | Night |
|---|---|---|---|
| Key (directional, soft shadows, 2048 map) | Warm white `#fff4e2`, 2.4, high front-right | Orange `#ffb27a`, 2.0, low left | Blue `#9fb2ff`, 0.8 |
| Fill (hemisphere sky/ground) | 1.0 | 0.7 | 0.45 |
| Rim (directional from behind) | Cool `#cfe0ff`, 1.0 | `#ffd0a0`, 1.3 | `#7fa0ff`, 0.9 |

- Interiors add warm point lights (ceiling/lamps) and a 1.8× fill.
- Tone mapping is Neutral at exposure 1.05, and shadows are PCF-soft.
- Each character gets a **soft contact shadow** (blob AO) so it is grounded even when the key light is off to the side.
- Aerial perspective: gradient sky dome plus distance fog matched to the horizon colour.
- No bloom, SSAO or DOF post-processing; they are too costly for software WebGL.

## 6. Environments

- Every outdoor set has **three depth layers**: background (sky dome, clouds, mountain or skyline silhouettes, hills), midground (trees, buildings, benches, fences, set dressing) and foreground (small grass tufts, pebbles, near the lens but outside the central acting area).
- **Acting area:** x ∈ [-6, 6], z ∈ [-2, 2]. Keep it clear of anything taller than 0.2 m unless it is an interactive prop.
- Presets: `studio`, `park`, `forest`, `street`, `cliff`, `office`, `living-room` (alias `room`). Each accepts `timeOfDay` and `palette` overrides.
- Assets are reusable components in `three/assets.tsx`, built from primitives, deterministic (seeded scatter) and instanced when repeated.
- Avoid clutter: aim for at most about 3 midground focal objects in frame behind the characters.

## 7. Camera rules

| Shot | Distance | Lens (FOV) | Use |
|---|---|---|---|
| establishing | 14 m | 42° | Open a new location; characters small |
| wide | 8.5 m | 40° | Action across space, walking or running |
| two-shot | 5.4 m | 36° | Two or three characters interacting |
| medium | 4.2 m | 34° | Default dialogue and gesture |
| close | 2.6 m | 28° | Emotion and reaction |
| extreme-close | 1.5 m | 24° | One beat of emphasis; at most one per minute |
| over-shoulder | 2.2 m behind `from` | 32° | Conversation coverage |
| low / high | — | 40° | Power or vulnerability; use sparingly |

Moves: `static push-in pull-out pan-left pan-right track orbit crane-up`. Every move needs a **story reason**:

- push-in builds realisation or tension
- pull-out reveals
- track follows travel
- orbit shows teamwork or effort
- crane-up gives a conclusion or sense of scale

Use at most one move type per shot. Keep the camera on the action side of the 180° line between conversing characters, and keep `angle` consistent across a dialogue exchange. Hold static for reaction beats. Shake is reserved for physical effort or impact (≤ 0.5).

## 8. Animation principles

- **Deterministic:** every pose is a pure function of time; no randomness or state.
- **Weight:** gaits have a hip bob twice per cycle, a lateral weight shift and counter-rotation of torso against legs. Speed ramps in and out, and lean follows acceleration (momentum).
- **No foot sliding:** gait phase comes from distance travelled. A ground-contact solver keeps soles on the floor.
- **Anticipation and follow-through:** jumps crouch first; reactions overshoot (`backOut`); arm swing lags the legs; the head leads body turns.
- **Transitions:** 0.35 s eased cross-fade between any two cues. Facing turns over 0.35 s.
- **Gestures:** each talking or reaction action sets a hand shape; one clear gesture per beat.
- **Interaction:** use IK (`reach` in a beat) when hands must touch something: a prop, a boulder, another character. Do not fake contact by moving the character.
- **Readability over realism:** poses should read in silhouette. Check them with `npm run action-sheet`.

## 9. Performance budget

- **Defaults:** 720p, 24 fps. 1080p is optional (`--quality 1080p`).
- **Geometry:** characters are about 6k triangles; sets are built from primitives, with scatter (grass, flowers) instanced in one draw call each. One shadow-casting light and 2048 shadow map; extra point lights don't cast shadows.
- Expect roughly 0.4–1.5 s per frame on a 4-core cloud container with software WebGL. Use `scripts/stills.ts` to review frames before a full render.

## 10. Benchmark (regression check for this guide)

```bash
npm run build -- style-benchmark && npm run benchmark
```

This renders `out/benchmark/`:
1. Close-up expression sheet
2. Dialogue
3. Walk → run filmstrip
4. Three characters interacting
5. Push with IK
6. Cinematic outdoor (dusk)
7. Detailed indoor
8. Action contact sheet

Inspect the frames after any change to the rig, lighting or sets.
